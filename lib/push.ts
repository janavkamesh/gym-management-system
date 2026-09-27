import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export async function sendPushToAllDevices(targetUserId: string, payload: { title: string; body: string; url: string; tag?: string; requireInteraction?: boolean }) {
  const vapidSubject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!vapidSubject || !publicKey || !privateKey || !supabaseUrl || !supabaseKey) {
    console.error('Missing push or supabase env variables');
    return;
  }

  webpush.setVapidDetails(vapidSubject, publicKey, privateKey);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', targetUserId);

  if (error || !subscriptions) {
    console.error('Failed to fetch subscriptions:', error);
    return;
  }

  const payloadString = JSON.stringify(payload);

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub.subscription_json, payloadString);
    } catch (error: any) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        // Subscription expired or invalid
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', sub.endpoint);
      } else {
        console.error('Push notification failed:', error);
      }
    }
  }
}
