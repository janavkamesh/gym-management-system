import { NextResponse } from 'next/server';
import { runDailyNotifications } from '@/lib/notifications';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const authHeader = request.headers.get('Authorization');
  const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  const validKey = process.env.BACKUP_SECRET;

  if (key !== validKey && bearerKey !== validKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runDailyNotifications();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to run daily notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
