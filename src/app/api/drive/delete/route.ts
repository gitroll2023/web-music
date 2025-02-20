import { NextResponse } from 'next/server';
import { deleteFileFromDrive } from '@/utils/google-drive';

export async function POST(request: Request) {
  try {
    const { fileId } = await request.json();
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteFileFromDrive(fileId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete file from Google Drive' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in delete route:', error?.message || error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}
