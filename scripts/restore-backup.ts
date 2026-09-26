import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

async function restore() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Please provide a path to the backup JSON file.");
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(absolutePath, 'utf-8');
  const backup = JSON.parse(fileContent);

  if (!backup.tables) {
    console.error("Invalid backup file: 'tables' key is missing.");
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment (.env.local).");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  const orderedTables = [
    // Step 1: Parents
    'plans',
    'trainers',
    // Step 2: Core Entities
    'members',
    'leads',
    // Step 3: Dependents & Logs
    'pt_assignments',
    'payments',
    'salary_payments',
    'salary_advances',
    'expenses',
    'activity_logs'
  ];

  for (const table of orderedTables) {
    const rows = backup.tables[table];
    if (!rows || rows.length === 0) {
      console.log(`Skipping [${table}] - no rows found in backup.`);
      continue;
    }

    const batchSize = 500;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id' });
      
      if (error) {
        console.error(`Failed to restore batch ${i} to ${i + batchSize} in [${table}]:`, error.message);
        process.exit(1);
      }
    }
    console.log(`Restored ${rows.length} rows into [${table}]`);
  }

  console.log("Restore completed successfully. 🎉");
}

restore().catch((err) => {
  console.error("Restore failed:", err);
  process.exit(1);
});
