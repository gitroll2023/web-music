import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

const popularPath = join(process.cwd(), 'src', 'data', 'popular.json');

export async function GET() {
  try {
    const data = await fs.readFile(popularPath, 'utf-8');
    const popular = JSON.parse(data);
    return NextResponse.json(popular);
  } catch (error) {
    console.error('Error reading popular songs:', error);
    return NextResponse.json({ error: 'Failed to read popular songs' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { songs } = await request.json();
    await fs.writeFile(popularPath, JSON.stringify({ songs }, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating popular songs:', error);
    return NextResponse.json({ error: 'Failed to update popular songs' }, { status: 500 });
  }
}
