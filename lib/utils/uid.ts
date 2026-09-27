import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Derives a 2-letter prefix from a gym name.
 */
export function getUidPrefix(gymName: string | null | undefined): string {
  let prefix = 'GM'
  if (gymName) {
    const words = gymName.trim().split(/\s+/)
    if (words.length > 1) {
      prefix = words.map(w => w[0]).join('').substring(0, 2).toUpperCase()
    } else if (words.length === 1 && words[0].length >= 2) {
      prefix = words[0].substring(0, 2).toUpperCase()
    } else if (words.length === 1 && words[0].length === 1) {
      prefix = words[0].toUpperCase() + 'M'
    }
  }
  // Ensure we only return alphabet characters, fallback to GM if symbols
  const finalPrefix = prefix.replace(/[^A-Z]/g, '')
  return finalPrefix.length === 2 ? finalPrefix : 'GM'
}

/**
 * Computes the maximum UID number currently in use for a tenant.
 */
export async function getMaxUidNumber(supabase: SupabaseClient, userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('members')
    .select('uid')
    .eq('user_id', userId)
    .not('uid', 'is', null)

  let maxNum = 0
  if (!error && data) {
    for (const row of data) {
      if (row.uid && row.uid.includes('-')) {
        const parts = row.uid.split('-')
        const numPart = parts[parts.length - 1]
        const num = parseInt(numPart, 10)
        if (!isNaN(num) && num > maxNum) {
          maxNum = num
        }
      }
    }
  }
  return maxNum
}

/**
 * Generates the next UID string based on the max number.
 */
export function formatUid(prefix: string, number: number): string {
  return `${prefix}-${number.toString().padStart(4, '0')}`
}

/**
 * Main utility to generate the next UID for a tenant.
 * Pass offset for bulk generation (e.g. CSV imports).
 */
export async function generateNextUid(
  supabase: SupabaseClient,
  userId: string,
  gymName: string | null | undefined,
  offset: number = 0
): Promise<string> {
  const prefix = getUidPrefix(gymName)
  const maxNum = await getMaxUidNumber(supabase, userId)
  return formatUid(prefix, maxNum + 1 + offset)
}
