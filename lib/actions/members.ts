'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PLACEHOLDER_USER_ID } from '@/lib/constants'
import { logActivity } from '@/lib/activity-log'
import { formatINR, formatDate } from '@/lib/utils/formatters'

/**
 * Helper: get the current user ID.
 * Uses auth session if available, otherwise falls back to placeholder.
 * TODO: Remove fallback once login/signup UI is built.
 */
async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: userData } = await supabase.auth.getUser()
  return userData?.user?.id || PLACEHOLDER_USER_ID
}

/**
 * Task 1 — Create Member
 * Inserts a new member row. Fetches the plan duration to compute expiry_date.
 */
export async function createMember(data: { 
  name: string; 
  phone: string; 
  plan_id: string; 
  join_date: string;
  expiry_date?: string;
  payment_amount?: number;
  payment_method?: string;
  pt?: { hasPt: boolean; trainerId: string; ptFee?: number; trainerShare?: number; ptDurationDays?: number };
}) {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  let finalExpiryDate = data.expiry_date;
  if (!finalExpiryDate) {
    // Fetch plan duration to calculate expiry_date
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('duration_days')
      .eq('id', data.plan_id)
      .single()

    if (planError || !plan) throw new Error('Plan not found')

    const joinDate = new Date(data.join_date)
    const expiryDate = new Date(joinDate)
    expiryDate.setDate(expiryDate.getDate() + plan.duration_days)
    finalExpiryDate = expiryDate.toISOString().split('T')[0]
  }

  const { data: member, error } = await supabase
    .from('members')
    .insert({
      user_id: userId,
      plan_id: data.plan_id,
      name: data.name,
      phone: data.phone,
      join_date: data.join_date,
      expiry_date: finalExpiryDate,
      status: 'Active'
    })
    .select()
    .single()

  if (error) throw error

  const { data: planData } = await supabase.from('plans').select('plan_name').eq('id', data.plan_id).single()
  await logActivity({
    category: 'Members',
    action: 'Added',
    description: `Added member ${data.name} (${planData?.plan_name || 'Plan'})`,
    entityType: 'member',
    entityId: member.id,
    entityName: data.name
  })

  if (data.payment_amount && data.payment_amount > 0) {
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        member_id: member.id,
        amount: data.payment_amount,
        method: data.payment_method || 'Cash',
        date: new Date().toISOString().split('T')[0],
        period_start: data.join_date,
        period_end: finalExpiryDate,
        payment_type: 'Membership'
      });
    
    if (paymentError) {
      console.error('Payment insertion failed:', paymentError);
    } else {
      await logActivity({
        category: 'Payments',
        action: 'Collected',
        description: `Collected ${formatINR(data.payment_amount)} via ${data.payment_method || 'Cash'} from ${data.name}`,
        entityType: 'member',
        entityId: member.id,
        entityName: data.name,
        amount: data.payment_amount
      })
    }
  }

  // Handle PT Assignment
  if (data.pt?.hasPt && data.pt?.trainerId) {
    const { error: ptError } = await supabase.from('pt_assignments').insert({
      member_id: member.id,
      trainer_id: data.pt.trainerId,
      commission_percent: 0,
      fee_amount: data.pt.ptFee,
      trainer_share: data.pt.trainerShare,
      duration_days: data.pt.ptDurationDays,
      is_active: true,
      assigned_date: new Date().toISOString().split('T')[0]
    });
    if (ptError) console.error('PT assignment insert failed:', ptError);
  }
  
  revalidatePath('/members')
  revalidatePath('/financials')
  revalidatePath('/trainers')
  revalidatePath('/') // Dashboard
  return member
}

/**
 * Task 2 — Update Member
 * Updates editable fields. Recalculates expiry_date if plan_id or join_date changes.
 */
export async function updateMember(memberId: string, data: { name?: string; phone?: string; plan_id?: string; join_date?: string; expiry_date?: string; pt?: { hasPt: boolean; trainerId: string; ptFee?: number; trainerShare?: number; ptDurationDays?: number }; payment?: { id?: string; amount?: number } }) {
  const supabase = await createClient()
  const userId = await getUserId(supabase)
  
  const updates: Record<string, any> = { ...data }

  // Only auto-calculate expiry_date if plan_id or join_date changes AND expiry_date wasn't explicitly provided
  if (!data.expiry_date && (data.plan_id || data.join_date)) {
    const { data: currentMember, error: memberError } = await supabase
      .from('members')
      .select('plan_id, join_date')
      .eq('id', memberId)
      .eq('user_id', userId)
      .single()

    if (memberError || !currentMember) throw new Error('Member not found')

    const newPlanId = data.plan_id || currentMember.plan_id
    const newJoinDateStr = data.join_date || currentMember.join_date

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('duration_days')
      .eq('id', newPlanId)
      .single()

    if (planError || !plan) throw new Error('Plan not found')

    const joinDate = new Date(newJoinDateStr)
    const expiryDate = new Date(joinDate)
    expiryDate.setDate(expiryDate.getDate() + plan.duration_days)

    updates.expiry_date = expiryDate.toISOString().split('T')[0]
  }

  const { data: updated, error } = await supabase
    .from('members')
    .update({
      name: data.name,
      phone: data.phone,
      plan_id: data.plan_id,
      join_date: data.join_date,
      expiry_date: updates.expiry_date
    })
    .eq('id', memberId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error

  await logActivity({
    category: 'Members',
    action: 'Edited',
    description: `Edited member ${data.name || updated.name}`,
    entityType: 'member',
    entityId: updated.id,
    entityName: data.name || updated.name
  })

  // Payment updates have been removed from here. They are exclusively handled by editPayment in payments.ts.

  // Handle PT updates
  if (data.pt) {
    // get active PT assignment
    const { data: activePt } = await supabase
      .from('pt_assignments')
      .select('*')
      .eq('member_id', memberId)
      .eq('is_active', true)
      .single();

    if (!data.pt.hasPt) {
      if (activePt) {
        await supabase
          .from('pt_assignments')
          .update({ is_active: false })
          .eq('id', activePt.id);
      }
    } else if (data.pt.hasPt && data.pt.trainerId) {
      if (!activePt || activePt.trainer_id !== data.pt.trainerId) {
        if (activePt) {
          await supabase
            .from('pt_assignments')
            .update({ is_active: false })
            .eq('id', activePt.id);
        }
        const { error: ptError } = await supabase.from('pt_assignments').insert({
          member_id: memberId,
          trainer_id: data.pt.trainerId,
          commission_percent: 0,
          fee_amount: data.pt.ptFee,
          trainer_share: data.pt.trainerShare,
          duration_days: data.pt.ptDurationDays,
          is_active: true,
          assigned_date: new Date().toISOString().split('T')[0]
        });
        if (ptError) console.error('PT assignment insert failed:', ptError);
      } else if (activePt) {
        // Trainer is the same, update the existing row
        await supabase.from('pt_assignments').update({
          fee_amount: data.pt.ptFee,
          trainer_share: data.pt.trainerShare,
          duration_days: data.pt.ptDurationDays
        }).eq('id', activePt.id);
      }
    }
  }
  
  revalidatePath('/members')
  revalidatePath('/trainers')
  revalidatePath('/')
  return updated
}

/**
 * Task 3 — Freeze / Pause
 * Suspends the account and pushes expiry_date forward by the freeze duration.
 */
export async function freezeMember(memberId: string, freezeStart: string, freezeEnd: string) {
  const supabase = await createClient()

  const start = new Date(freezeStart)
  const end = new Date(freezeEnd)
  
  // Calculate freeze duration in days (freeze_end - freeze_start)
  const diffTime = end.getTime() - start.getTime()
  const freezeDurationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (freezeDurationDays <= 0) {
    throw new Error('Freeze end date must be after freeze start date')
  }

  // Fetch current expiry_date and name
  const { data: member, error: fetchError } = await supabase
    .from('members')
    .select('name, expiry_date')
    .eq('id', memberId)
    .single()

  if (fetchError || !member) throw new Error('Member not found')

  const expiryDate = new Date(member.expiry_date)
  expiryDate.setDate(expiryDate.getDate() + freezeDurationDays)

  const { data: updated, error } = await supabase
    .from('members')
    .update({
      freeze_start: start.toISOString().split('T')[0],
      freeze_end: end.toISOString().split('T')[0],
      expiry_date: expiryDate.toISOString().split('T')[0]
    })
    .eq('id', memberId)
    .select()
    .single()

  if (error) throw error
  
  await logActivity({
    category: 'Members',
    action: 'Frozen',
    description: `Froze membership for ${member.name} from ${formatDate(start.toISOString())} to ${formatDate(end.toISOString())}`,
    entityType: 'member',
    entityId: memberId,
    entityName: member.name
  })

  revalidatePath('/members')
  revalidatePath('/')
  return updated
}

export async function deleteMember(memberId: string) {
  const supabase = await createClient()

  const { data: member } = await supabase.from('members').select('name').eq('id', memberId).single()

  const { error } = await supabase
    .from('members')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', memberId)

  if (error) throw error
  
  await logActivity({
    category: 'Members',
    action: 'Removed',
    description: `Removed member ${member?.name || 'Unknown'}`,
    entityType: 'member',
    entityId: memberId,
    entityName: member?.name
  })

  revalidatePath('/members')
  revalidatePath('/')
  return true
}

export async function restoreMember(memberId: string) {
  const supabase = await createClient()

  const { data: member } = await supabase.from('members').select('name').eq('id', memberId).single()

  const { error } = await supabase
    .from('members')
    .update({ archived_at: null })
    .eq('id', memberId)

  if (error) throw error
  
  revalidatePath('/members')
  revalidatePath('/')
  return true
}

export async function getArchivedMembers() {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  const { data, error } = await supabase
    .from('members')
    .select('*, plans(*)')
    .eq('user_id', userId)
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Task 5 — Preview CSV Import
 * Checks rows against the database and returns validation statuses.
 */
export async function previewMembersCSV(rows: any[]) {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  const { data: plans } = await supabase.from('plans').select('id, plan_name').eq('user_id', userId)
  const planMap = new Map((plans || []).map(p => [p.plan_name.trim().toLowerCase(), p.id]))

  const { data: existingMembers } = await supabase.from('members').select('phone').eq('user_id', userId)
  const existingPhones = new Set((existingMembers || []).map(m => m.phone.trim()))

  const results = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const name = row.name?.toString().trim()
    const phone = row.phone?.toString().trim()
    const plan_name = row.plan_name?.toString().trim()
    const join_date = row.join_date?.toString().trim()
    const expiry_date = row.expiry_date?.toString().trim()
    
    if (!name || !phone || !plan_name || !join_date || !expiry_date) {
      results.push({ row: i + 1, data: row, status: 'Failed', reason: 'Missing required fields' })
      continue
    }

    const planId = planMap.get(plan_name.toLowerCase())
    if (!planId) {
      results.push({ row: i + 1, data: row, status: 'Failed', reason: `Plan "${plan_name}" not found` })
      continue
    }

    if (existingPhones.has(phone)) {
      results.push({ row: i + 1, data: row, status: 'Skipped', reason: 'Phone number already exists' })
      continue
    }
    
    if (isNaN(new Date(join_date).getTime()) || isNaN(new Date(expiry_date).getTime())) {
      results.push({ row: i + 1, data: row, status: 'Failed', reason: 'Invalid date format' })
      continue
    }

    existingPhones.add(phone) // prevent duplicate phone in same csv batch
    
    results.push({ 
      row: i + 1, 
      data: row, 
      status: 'Pass', 
      reason: '',
      validatedData: {
        user_id: userId,
        name: name,
        phone: phone,
        plan_id: planId,
        join_date: new Date(join_date).toISOString().split('T')[0],
        expiry_date: new Date(expiry_date).toISOString().split('T')[0],
        status: 'Active'
      }
    })
  }
  return results
}

/**
 * Task 5 — Execute CSV Import
 * Inserts pre-validated rows into the database.
 */
export async function executeMembersImport(validatedRows: any[]) {
  if (!validatedRows || validatedRows.length === 0) return 0
  
  const supabase = await createClient()
  const { error } = await supabase.from('members').insert(validatedRows)
  
  if (error) throw error
  
  revalidatePath('/members')
  revalidatePath('/')
  return validatedRows.length
}

