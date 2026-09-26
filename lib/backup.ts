import { createClient } from '@supabase/supabase-js';

// Reusable backup logic
export async function runDatabaseBackup(secret: string, envParams?: any) {
  // Use provided env (Cloudflare worker) or process.env (Next.js Node/Edge runtime)
  const env = envParams || process.env;

  if (!env.BACKUP_SECRET) {
    throw new Error("Missing BACKUP_SECRET in environment");
  }

  if (secret !== env.BACKUP_SECRET) {
    throw new Error("Unauthorized: Invalid or missing backup secret");
  }

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase credentials in environment");
  }

  // Create an admin client bypassing RLS
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
      }
    }
  );

  const tables = [
    'users',
    'plans',
    'members',
    'leads',
    'payments',
    'expenses',
    'trainers',
    'pt_assignments',
    'salary_advances',
    'salary_payments',
    'activity_logs'
  ];

  const results: Record<string, any[]> = {};

  // Fetch all tables in parallel
  await Promise.all(
    tables.map(async (table) => {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        throw new Error(`Failed to fetch ${table}: ${error.message}`);
      }
      results[table] = data || [];
    })
  );

  const timestamp = new Date().toISOString();
  
  const payload = {
    secret: env.BACKUP_SECRET,
    timestamp,
    tables: results
  };

  if (!env.GOOGLE_DRIVE_WEBHOOK_URL) {
    throw new Error("Missing GOOGLE_DRIVE_WEBHOOK_URL in environment");
  }

  // Send to Google Drive Webhook
  const response = await fetch(env.GOOGLE_DRIVE_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Google Drive Webhook failed with status ${response.status}`);
  }

  // Also send to CLIENT_DRIVE_WEBHOOK_URL if defined
  if (env.CLIENT_DRIVE_WEBHOOK_URL) {
    await fetch(env.CLIENT_DRIVE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).catch(err => console.error("Client webhook failed:", err));
  }

  return {
    status: "success",
    timestamp,
    tablesBackedUp: tables
  };
}
