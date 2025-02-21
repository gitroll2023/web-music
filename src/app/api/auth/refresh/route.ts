import { NextResponse } from 'next/server';
import { refreshGoogleToken } from '@/lib/googleDrive';

export async function GET() {
  try {
    await refreshGoogleToken();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ error: 'Token refresh failed' }, { status: 500 });
  }
}
