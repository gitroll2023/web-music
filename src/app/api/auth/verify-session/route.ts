import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_SECRET = process.env.SESSION_SECRET || 'web-music-admin-session-secret-key-2024';
const SESSION_MAX_AGE_MS = 60 * 60 * 1000;

async function createHmac(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyHmac(key: string, message: string, expectedHmac: string): Promise<boolean> {
  const computedHmac = await createHmac(key, message);
  if (computedHmac.length !== expectedHmac.length) return false;
  let result = 0;
  for (let i = 0; i < computedHmac.length; i++) {
    result |= computedHmac.charCodeAt(i) ^ expectedHmac.charCodeAt(i);
  }
  return result === 0;
}

async function verifySessionToken(token: string): Promise<{ valid: boolean; remainingMs: number }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false, remainingMs: 0 };

    const [timestamp, hmac] = parts;
    const timestampNum = parseInt(timestamp, 10);
    if (isNaN(timestampNum)) return { valid: false, remainingMs: 0 };

    const now = Date.now();
    const remainingMs = SESSION_MAX_AGE_MS - (now - timestampNum);
    if (remainingMs <= 0) return { valid: false, remainingMs: 0 };

    const isValid = await verifyHmac(SESSION_SECRET, timestamp, hmac);
    return { valid: isValid, remainingMs: isValid ? remainingMs : 0 };
  } catch {
    return { valid: false, remainingMs: 0 };
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin-session');

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false });
    }

    const { valid, remainingMs } = await verifySessionToken(sessionCookie.value);

    if (!valid) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({ authenticated: true, remainingMs });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
