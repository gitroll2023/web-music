import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Reorder songs by updating their IDs/order in the database.
 *
 * Previously this route wrote to a local songs.json file,
 * which caused sync issues with the Prisma database.
 * Now it uses Prisma directly for consistency.
 *
 * Expects a POST body with:
 * {
 *   songs: Array<{ id: number; newOrder: number }>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { songs } = await request.json();

    if (!Array.isArray(songs) || songs.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: songs array is required' },
        { status: 400 }
      );
    }

    // Validate that each song entry has the required fields
    for (const song of songs) {
      if (typeof song.id !== 'number' || typeof song.newOrder !== 'number') {
        return NextResponse.json(
          { error: 'Invalid request: each song must have numeric id and newOrder fields' },
          { status: 400 }
        );
      }
    }

    // Update song order in a transaction for atomicity
    await prisma.$transaction(
      songs.map((song: { id: number; newOrder: number }) =>
        prisma.song.update({
          where: { id: song.id },
          data: { id: song.newOrder },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering songs:', error);
    return NextResponse.json(
      { error: 'Failed to reorder songs' },
      { status: 500 }
    );
  }
}
