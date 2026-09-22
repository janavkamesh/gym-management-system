'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Task 4 — Log Payment
 * Inserts a row into payments linked to a member. 
 * Does not change expiry_date directly as that's handled by renewal/creation.
 */
export async function logPayment(memberId: string, amount: number, method: string, date: string) {
  const supabase = await createClient()
  
  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      member_id: memberId,
      amount,
      method,
      date
    })
    .select()
    .single()

  if (error) throw error
  
  // Revalidate relevant pages where payment logic/dashboard is shown
  revalidatePath('/members')
  revalidatePath('/financials')
  return payment
}
