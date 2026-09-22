'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Task 1 — Create Lead
 * Inserts a new lead with outcome defaulting to "Pending".
 */
export async function createLead(data: { name: string; phone: string; promised_date: string }) {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('Not authenticated')

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      user_id: userData.user.id,
      name: data.name,
      phone: data.phone,
      promised_date: data.promised_date,
      outcome: 'Pending'
    })
    .select()
    .single()

  if (error) throw error
  
  revalidatePath('/leads')
  revalidatePath('/') // Updates Dashboard follow-ups if applicable
  return lead
}



/**
 * Task 3 — Update Lead Outcome
 * Updates a lead's outcome. Validates against the 4 exact allowed values.
 */
export async function updateLeadOutcome(leadId: string, outcome: string) {
  const supabase = await createClient()

  const allowedOutcomes = ['Pending', 'Joined', 'Not Interested', 'No Response']
  
  if (!allowedOutcomes.includes(outcome)) {
    throw new Error('Invalid outcome value. Must be one of: Pending, Joined, Not Interested, No Response')
  }

  // Task 4: Do Not Build Conversion Logic
  // We only update the outcome field. No conversion to member logic here.
  const { data: updated, error } = await supabase
    .from('leads')
    .update({ outcome })
    .eq('id', leadId)
    .select()
    .single()

  if (error) throw error
  
  revalidatePath('/leads')
  revalidatePath('/') // Updates Dashboard follow-ups
  return updated
}
