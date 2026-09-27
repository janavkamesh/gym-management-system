import { createClient } from '@supabase/supabase-js'

// Need to mock getUserId and createClient for the test because we are outside Next.js
import * as serverModule from './lib/supabase/server'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ixsbktjhfrqtamqundem.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_tjVjjjID2h1NrF9H0dZUWQ_4BBdZAqV"
const mockSupabase = createClient(supabaseUrl, supabaseKey)
// Mock the createClient
// @ts-ignore
serverModule.createClient = async () => mockSupabase;

import { previewMembersCSV, executeMembersImport } from './lib/actions/members'

async function run() {
  console.log('Generating 82 rows of dummy data...')
  const rows = []
  for (let i = 1; i <= 82; i++) {
    rows.push({
      name: `Test Member ${i}`,
      phone: `99999${i.toString().padStart(5, '0')}`,
      plan_name: '3 Months',
      amount: 15000,
      join_date: '2024-01-01',
      expiry_date: '2024-04-01',
      gender: 'Male',
      uid: ''
    })
  }

  console.log('Running previewMembersCSV...')
  const startPreview = Date.now()
  const previewResults = await previewMembersCSV(rows)
  const endPreview = Date.now()
  console.log(`Preview completed in ${endPreview - startPreview}ms`)
  
  const validRows = previewResults.filter((r: any) => r.status === 'Pass').map((r: any) => r.validatedData)
  
  const { count: beforeCount } = await mockSupabase.from('members').select('*', { count: 'exact', head: true })

  console.log('Running executeMembersImport...')
  const startImport = Date.now()
  const importCount = await executeMembersImport(validRows)
  const endImport = Date.now()
  console.log(`Import completed in ${endImport - startImport}ms. Inserted: ${importCount}`)

  const { count: afterCount, data: recentMembers } = await mockSupabase.from('members')
    .select('uid, phone')
    .order('created_at', { ascending: false })
    .limit(5)

  console.log(`Members before import: ${beforeCount}`)
  console.log(`Members after import: ${afterCount}`)
  console.log('Recent UIDs/phones:', recentMembers)
}

run().catch(console.error)
