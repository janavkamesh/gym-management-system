import { NextResponse } from 'next/server';
import { sendPushToAllDevices } from '@/lib/push';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (key !== process.env.BACKUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await sendPushToAllDevices({
    title: "GymAdmin Notifications Active!",
    body: "Your laptop/mobile push pipeline is connected.",
    url: "/members"
  });

  return NextResponse.json({ success: true, message: 'Push sent to all devices' });
}
