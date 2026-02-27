import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const order = searchParams.get('order');

  if (!order) {
    return NextResponse.json({ error: 'Order parameter is required' }, { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'lyrics', `${order}.txt`);
    const lyrics = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json({ lyrics });
  } catch (error) {
    return NextResponse.json({ error: 'Lyrics not found' }, { status: 404 });
  }
} 