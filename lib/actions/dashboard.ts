'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * 1. getExpiringMembers()
 * Returns members where the expiry date is within the next 3 days (Yellow) 
 * or has already passed (Red).
 * Query Logic: expiry_date <= today + 3 days
 */
export async function getExpiringMembers() {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('Not authenticated')

  // Calculate UTC threshold date (Today + 3 days)
  const now = new Date()
  const thresholdDate = new Date(now)
  thresholdDate.setDate(thresholdDate.getDate() + 3)
  const thresholdStr = thresholdDate.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('members')
    .select('*, plans(*)')
    .eq('user_id', userData.user.id)
    .lte('expiry_date', thresholdStr)
    .order('expiry_date', { ascending: true })

  if (error) throw error
  return data
}

/**
 * 2. getTodaysFollowUps()
 * Returns leads where promised_date equals today's date (server time UTC).
 * Query Logic: promised_date == today
 */
export async function getTodaysFollowUps() {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('Not authenticated')

  // Calculate UTC today date string
  const todayStr = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('promised_date', todayStr)
    .order('created_at', { ascending: false })

  if (error) throw error
  
  return data
}

/**
 * 3. getReviewPrompts()
 * Returns members where join_date was exactly 30 days ago.
 * Query Logic: join_date == today - 30 days
 */
export async function getReviewPrompts() {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('Not authenticated')

  // Calculate exactly 30 days ago UTC
  const now = new Date()
  const minus30 = new Date(now)
  minus30.setDate(minus30.getDate() - 30)
  const minus30Str = minus30.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('members')
    .select('*, plans(*)')
    .eq('user_id', userData.user.id)
    .eq('join_date', minus30Str)
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

/**
 * 4. verifyMemberExists(id)
 * Verifies if a member still exists before navigating or opening WhatsApp.
 */
export async function verifyMemberExists(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('members')
    .select('id')
    .eq('id', id)
    .single()
  
  if (error || !data) return false
  return true
}

/**
 * 5. verifyLeadExists(id)
 * Verifies if a lead still exists before navigating.
 */
export async function verifyLeadExists(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('leads')
    .select('id')
    .eq('id', id)
    .single()
  
  if (error || !data) return false
  return true
}
