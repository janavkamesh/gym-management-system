import { createClient } from '@supabase/supabase-js';
import { sendPushToAllDevices } from './push';

export async function runDailyNotifications(envParams?: any) {
  const env = envParams || process.env;
  
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase credentials in environment");
  }

  if (envParams) {
    process.env.VAPID_SUBJECT = envParams.VAPID_SUBJECT || process.env.VAPID_SUBJECT;
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = envParams.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    process.env.VAPID_PRIVATE_KEY = envParams.VAPID_PRIVATE_KEY || process.env.VAPID_PRIVATE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = envParams.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = envParams.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const getISTDateStr = (date: Date) => {
    return date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2');
  }

  const now = new Date();
  const todayIST = getISTDateStr(now);
  const currentMonth = todayIST.substring(0, 7);
  const todayDateObj = new Date(`${todayIST}T00:00:00+05:30`);
  
  const diffInDays = (dateStr: string | null) => {
    if (!dateStr) return null;
    const targetDate = new Date(`${dateStr}T00:00:00+05:30`);
    const diffTime = todayDateObj.getTime() - targetDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const notificationsToSend: any[] = [];
  
  // 1. Members
  const { data: members } = await supabase.from('members').select('id, name, expiry_date').is('archived_at', null).eq('status', 'Active');
  if (members && members.length > 0) {
    const expiringToday: any[] = [];
    const overdue: any[] = [];
    members.forEach(m => {
      const diff = diffInDays(m.expiry_date);
      if (diff === 0) expiringToday.push(m);
      else if (diff !== null && diff >= 1 && diff <= 6) overdue.push({ ...m, diff });
      else if (diff === 7) {
        notificationsToSend.push({
          title: `🗑️ Remove Inactive Member? (Expired 7 Days Ago)`,
          body: `${m.name} expired 7 days ago. Have they left the gym? Tap to remove them from your active list.`,
          url: `/members?action=cleanup&memberId=${m.id}`,
          tag: `member-cleanup-${m.id}`,
          requireInteraction: true
        });
      }
    });

    if (expiringToday.length === 1) {
      notificationsToSend.push({
        title: `⚠️ Membership Expires Today`,
        body: `${expiringToday[0].name}'s membership expires today. Tap to collect renewal.`,
        url: `/members?filter=expiring_today&memberId=${expiringToday[0].id}`,
        tag: `members-expiring-today`
      });
    } else if (expiringToday.length > 1) {
      notificationsToSend.push({
        title: `⚠️ ${expiringToday.length} Memberships Expire Today`,
        body: `${expiringToday.map(m => m.name).join(', ')} expire today. Tap to collect renewals.`,
        url: `/members?filter=expiring_today`,
        tag: `members-expiring-today`
      });
    }

    if (overdue.length === 1) {
      const d = overdue[0].diff;
      notificationsToSend.push({
        title: `⏳ Membership Overdue (${d === 1 ? 'Yesterday' : d + ' Days Ago'})`,
        body: `${overdue[0].name} expired ${d === 1 ? 'yesterday (1 day ago)' : d + ' days ago'}. Tap to WhatsApp or log payment.`,
        url: `/members?filter=overdue&memberId=${overdue[0].id}`,
        tag: `members-overdue-followup`
      });
    } else if (overdue.length > 1) {
      const summary = overdue.map(m => `${m.name} (${m.diff}d ago)`).join(', ');
      notificationsToSend.push({
        title: `⏳ ${overdue.length} Memberships Overdue (1–6 Days)`,
        body: `${summary}. Tap to follow up or log payment.`,
        url: `/members?filter=overdue`,
        tag: `members-overdue-followup`
      });
    }
  }

  // 2. PT Renewal
  const { data: ptAssignments } = await supabase.from('pt_assignments').select('id, next_pt_due_date, member_id, members(name)').eq('is_active', true);
  if (ptAssignments && ptAssignments.length > 0) {
    const ptDue: any[] = [];
    ptAssignments.forEach((pt: any) => {
      const diff = diffInDays(pt.next_pt_due_date);
      if (diff === 0 || (diff !== null && diff >= 1 && diff <= 3)) ptDue.push({ ...pt, diff });
    });
    if (ptDue.length > 0) {
      const names = ptDue.map(pt => pt.members?.name || 'Unknown').join(', ');
      notificationsToSend.push({
        title: `🏋️ ${ptDue.length === 1 ? '1 PT Package Due Today' : ptDue.length + ' PT Packages Due'}`,
        body: `${names} PT package ${ptDue.some(p => p.diff === 0) && ptDue.length === 1 ? 'expires today' : 'is overdue'}. Tap to renew.`,
        url: `/trainers?filter=pt_due`,
        tag: `pt-due-alert`
      });
    }
  }

  // 3. Leads
  const { data: leads } = await supabase.from('leads').select('id, name').eq('promised_date', todayIST).is('converted_to_member_id', null).in('outcome', ['Pending', 'No Response']);
  if (leads && leads.length > 0) {
    notificationsToSend.push({
      title: `📞 ${leads.length} ${leads.length === 1 ? 'Lead' : 'Leads'} Promised to Join Today`,
      body: `Follow up with ${leads.map(l => l.name).join(', ')} today. Tap to call or WhatsApp.`,
      url: `/leads?filter=today`,
      tag: `leads-today-alert`
    });
  }

  // 4. Trainers Salary
  const { data: trainers } = await supabase.from('trainers').select('id, name, base_salary, join_date').is('archived_at', null);
  if (trainers && trainers.length > 0) {
    const { data: salaries } = await supabase.from('salary_payments').select('trainer_id, paid_date, is_voided').eq('is_voided', false);
    trainers.forEach(trainer => {
      const trainerSalaries = (salaries || []).filter(s => s.trainer_id === trainer.id).sort((a, b) => b.paid_date.localeCompare(a.paid_date));
      const latestPayment = trainerSalaries[0];
      let alreadyPaidThisMonth = false;
      if (latestPayment && latestPayment.paid_date.substring(0, 7) === currentMonth) alreadyPaidThisMonth = true;
      
      if (!alreadyPaidThisMonth) {
        const anchorDate = latestPayment?.paid_date || trainer.join_date;
        if (anchorDate && todayIST > anchorDate) {
          const anchorDay = parseInt(anchorDate.split('-')[2]);
          let targetDate = new Date(`${currentMonth}-01T00:00:00+05:30`);
          targetDate.setMonth(targetDate.getMonth() + 1);
          targetDate.setDate(0);
          const dueDay = Math.min(anchorDay, targetDate.getDate());
          const dueDateStr = `${currentMonth}-${dueDay.toString().padStart(2, '0')}`;
          
          const diff = diffInDays(dueDateStr);
          if (diff === 0 || diff === 1) {
            notificationsToSend.push({
              title: `💰 Trainer Salary Due: ${trainer.name}`,
              body: `${trainer.name}'s monthly salary (₹${Number(trainer.base_salary).toLocaleString('en-IN')}) is ${diff === 1 ? 'overdue from yesterday' : 'due today'}. Tap to pay.`,
              url: `/trainers?trainerId=${trainer.id}&action=pay_salary`,
              tag: `trainer-salary-${trainer.id}`
            });
          }
        }
      }
    });
  }

  // 5. Recurring Expenses
  const { data: expenses } = await supabase.from('expenses').select('id, category, amount, date').eq('recurring_flag', true).eq('is_voided', false);
  if (expenses && expenses.length > 0) {
    const groupedByCategory: Record<string, any[]> = {};
    expenses.forEach(e => {
      if (!groupedByCategory[e.category]) groupedByCategory[e.category] = [];
      groupedByCategory[e.category].push(e);
    });
    Object.keys(groupedByCategory).forEach(category => {
      const cats = groupedByCategory[category].sort((a, b) => b.date.localeCompare(a.date));
      const latest = cats[0];
      if (latest.date.substring(0, 7) !== currentMonth && todayIST > latest.date) {
        const anchorDay = parseInt(latest.date.split('-')[2]);
        let targetDate = new Date(`${currentMonth}-01T00:00:00+05:30`);
        targetDate.setMonth(targetDate.getMonth() + 1);
        targetDate.setDate(0);
        const dueDay = Math.min(anchorDay, targetDate.getDate());
        const dueDateStr = `${currentMonth}-${dueDay.toString().padStart(2, '0')}`;
        
        if (todayIST === dueDateStr) {
          notificationsToSend.push({
            title: `💳 Recurring Expense Due: ${latest.category}`,
            body: `Pay your recurring ${latest.category} (₹${Number(latest.amount).toLocaleString('en-IN')}) today. Tap to log expense.`,
            url: `/expenses?action=add&category=${encodeURIComponent(latest.category)}`,
            tag: `recurring-expense-${latest.category}`
          });
        }
      }
    });
  }

  for (const notif of notificationsToSend) {
    await sendPushToAllDevices(notif);
  }

  return {
    status: 'success',
    dateIST: todayIST,
    notificationsSentCount: notificationsToSend.length,
    notifications: notificationsToSend
  };
}
