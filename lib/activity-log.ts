'use server';

import { createClient } from '@/lib/supabase/server';
import { PLACEHOLDER_USER_ID } from '@/lib/constants';

export type ActivityCategory = 'Members' | 'Payments' | 'Leads' | 'Trainers' | 'Expenses' | 'WhatsApp' | 'Others';

export interface LogActivityInput {
  category: ActivityCategory;
  action: string;
  description: string;
  entityType?: string;
  entityId?: string | null;
  entityName?: string | null;
  amount?: number | null;
  metadata?: Record<string, unknown>;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || PLACEHOLDER_USER_ID;

    const { error } = await supabase.from('activity_logs').insert({
      user_id: userId,
      category: input.category,
      action: input.action,
      description: input.description,
      entity_type: input.entityType || null,
      entity_id: input.entityId || null,
      entity_name: input.entityName || null,
      amount: input.amount || null,
      metadata: input.metadata || {},
    });

    if (error) {
      console.error("[activity-log] Failed to insert log:", error);
    }
  } catch (error) {
    console.error("[activity-log] Exception during logging:", error);
  }
}
