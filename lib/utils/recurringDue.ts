export interface ExpenseItem {
  id?: string;
  user_id?: string;
  category: string;
  amount: number | string;
  recurring_flag?: boolean;
  date: string;
  is_voided?: boolean;
}

export interface DueRecurringExpense {
  category: string;
  lastAmount: number;
  dueDate: string;
  daysOverdue: number;
}

export function getDueRecurringExpenses(expenses: ExpenseItem[], todayIST: string): DueRecurringExpense[] {
  const currentMonth = todayIST.substring(0, 7);
  
  // Group non-voided expenses by category
  const categories: Record<string, ExpenseItem[]> = {};
  
  for (const exp of expenses) {
    if (exp.is_voided) continue;
    if (!categories[exp.category]) {
      categories[exp.category] = [];
    }
    categories[exp.category].push(exp);
  }

  const dueItems: DueRecurringExpense[] = [];

  for (const category in categories) {
    const cats = categories[category].sort((a, b) => b.date.localeCompare(a.date));
    
    // Check if there is ANY non-voided expense for this category in the current month
    const hasCurrentMonthEntry = cats.some(e => e.date.substring(0, 7) === currentMonth);
    
    if (hasCurrentMonthEntry) {
      continue; // Category counts as logged this month
    }
    
    // Find the latest non-voided expense with recurring_flag = true
    const latestRecurring = cats.find(e => e.recurring_flag);
    
    if (!latestRecurring) {
      continue; // No recurring template for this category
    }

    if (todayIST <= latestRecurring.date) {
      continue; // Latest recurring entry is in the future or today (already handled if it was current month, but just in case)
    }

    const anchorDay = parseInt(latestRecurring.date.split('-')[2], 10);
    
    // Calculate last day of the current month
    const [yearStr, monthStr] = currentMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    
    const targetDate = new Date(year, month, 0);
    const maxDaysInMonth = targetDate.getDate();
    
    const dueDay = Math.min(anchorDay, maxDaysInMonth);
    const dueDateStr = `${currentMonth}-${dueDay.toString().padStart(2, '0')}`;
    
    if (todayIST >= dueDateStr) {
      const todayDateObj = new Date(`${todayIST}T00:00:00+05:30`);
      const dueDateObj = new Date(`${dueDateStr}T00:00:00+05:30`);
      const diffTime = todayDateObj.getTime() - dueDateObj.getTime();
      const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      dueItems.push({
        category,
        lastAmount: Number(latestRecurring.amount),
        dueDate: dueDateStr,
        daysOverdue
      });
    }
  }

  return dueItems;
}
