import { NextResponse } from 'next/server'
import { previewMembersCSV, executeMembersImport } from '@/lib/actions/members'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

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
    const previewTime = endPreview - startPreview
    
    const validRows = previewResults.filter((r: any) => r.status === 'Pass').map((r: any) => r.validatedData)
    
    const { count: beforeCount } = await supabase.from('members').select('*', { count: 'exact', head: true })

    console.log('Running executeMembersImport...')
    const startImport = Date.now()
    const importCount = await executeMembersImport(validRows)
    const endImport = Date.now()
    const importTime = endImport - startImport

    const { count: afterCount, data: recentMembers } = await supabase.from('members')
      .select('uid, phone')
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      success: true,
      previewTimeMs: previewTime,
      importTimeMs: importTime,
      previewRows: previewResults.length,
      validRows: validRows.length,
      importCount,
      beforeCount,
      afterCount,
      recentMembers
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
