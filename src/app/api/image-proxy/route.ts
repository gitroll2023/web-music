import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get('id');

  if (!imageId) {
    return new NextResponse('Missing image ID', { status: 400 });
  }

  const googleDriveUrl = `https://drive.google.com/uc?export=view&id=${imageId}`;

  try {
    const response = await fetch(googleDriveUrl);
    const arrayBuffer = await response.arrayBuffer();
    const headers = new Headers(response.headers);
    
    // CORS 헤더 추가
    headers.set('Access-Control-Allow-Origin', '*');
    
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return new NextResponse('Error fetching image', { status: 500 });
  }
}
