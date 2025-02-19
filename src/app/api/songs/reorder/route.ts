import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

const songsPath = join(process.cwd(), 'src', 'data', 'songs.json');

export async function POST(request: NextRequest) {
  try {
    const { songs } = await request.json();
    await fs.writeFile(songsPath, JSON.stringify(songs, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering songs:', error);
    return NextResponse.json({ error: 'Failed to reorder songs' }, { status: 500 });
  }
}
