import { NextResponse } from 'next/server';
import { sendPushToAllDevices } from '@/lib/push';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const userId = searchParams.get('userId');

  if (key !== process.env.BACKUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!userId) {
    return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
  }

  await sendPushToAllDevices(userId, {
    title: "GymAdmin Notifications Active!",
    body: "Your laptop/mobile push pipeline is connected.",
    url: "/members"
  });

  return NextResponse.json({ success: true, message: 'Push sent to all devices' });
}
