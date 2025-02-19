import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // HTML에서 오디오 파일 URL 추출
    const audioUrlMatch = html.match(/https:\/\/dl\.sndup\.net\/[^"]+/);
    if (audioUrlMatch) {
      return NextResponse.json({ url: audioUrlMatch[0] });
    }
    
    return NextResponse.json({ url: url });
  } catch (error) {
    console.error('Error fetching audio URL:', error);
    return NextResponse.json({ error: 'Failed to fetch audio URL' }, { status: 500 });
  }
} 