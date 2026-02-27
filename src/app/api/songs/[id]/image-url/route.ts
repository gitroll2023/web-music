import { NextResponse } from 'next/server';
import { getGoogleDriveDirectLink } from '@/lib/googleDrive';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const songId = params.id;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    const imageUrl = `https://drive.google.com/uc?export=view&id=${imageId}`;
    const directUrl = await getGoogleDriveDirectLink(imageId);

    return NextResponse.json({ url: directUrl || imageUrl });
  } catch (error) {
    console.error('Error getting image URL:', error);
    return NextResponse.json(
      { error: 'Failed to get image URL' },
      { status: 500 }
    );
  }
}
