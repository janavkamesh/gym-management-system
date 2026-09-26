import { NextResponse } from 'next/server';
import { runDatabaseBackup } from '@/lib/backup';

export async function GET(request: Request) {
  return handleBackup(request);
}

export async function POST(request: Request) {
  return handleBackup(request);
}

async function handleBackup(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get('key');
    
    const authHeader = request.headers.get('Authorization');
    const headerSecret = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    const secret = querySecret || headerSecret;

    if (!secret) {
      return NextResponse.json({ error: "Unauthorized: Missing backup secret" }, { status: 401 });
    }

    const result = await runDatabaseBackup(secret);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Backup API Error:", error);
    const status = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status });
  }
}
