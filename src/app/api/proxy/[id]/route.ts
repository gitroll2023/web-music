import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { refreshAccessToken, getOAuth2Client } from '@/utils/tokenManager';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const fileId = params.id;
  if (!fileId) {
    return new NextResponse('File ID is required', { status: 400 });
  }

  try {
    // OAuth2 클라이언트 초기화
    const oauth2Client = await getOAuth2Client();
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    try {
      // 파일 메타데이터 가져오기 시도
      const fileMetadata = await drive.files.get({
        fileId: fileId,
        fields: 'mimeType, size, id'
      });

      if (!fileMetadata.data) {
        throw new Error('File metadata not found');
      }

      const mimeType = fileMetadata.data.mimeType;
      const isAudio = mimeType?.startsWith('audio/');
      const isImage = mimeType?.startsWith('image/');

      if (!isAudio && !isImage) {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      const headers = new Headers();
      headers.set('Content-Type', mimeType || 'application/octet-stream');

      if (isAudio) {
        headers.set('Accept-Ranges', 'bytes');
        const fileSize = Number(fileMetadata.data.size) || 0;
        
        if (fileSize > 0) {
          headers.set('Content-Length', fileSize.toString());
        }

        // Handle range requests for audio streaming
        const rangeHeader = request.headers.get('range');
        if (rangeHeader) {
          const range = rangeHeader.replace('bytes=', '').split('-');
          const start = parseInt(range[0]);
          const end = range[1] ? parseInt(range[1]) : fileSize - 1;
          
          if (!isNaN(start) && !isNaN(end) && start >= 0 && end < fileSize) {
            const rangeLength = end - start + 1;
            
            const response = await drive.files.get(
              {
                fileId: fileId,
                alt: 'media',
                acknowledgeAbuse: true
              },
              { 
                responseType: 'stream',
                headers: {
                  Range: `bytes=${start}-${end}`
                }
              }
            );

            headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
            headers.set('Content-Length', rangeLength.toString());

            return new NextResponse(response.data as unknown as ReadableStream, {
              status: 206,
              headers
            });
          }
        }
      }

      // Get full file content
      const response = await drive.files.get(
        {
          fileId: fileId,
          alt: 'media',
          acknowledgeAbuse: true
        },
        { responseType: 'stream' }
      );

      // Cache control
      headers.set('Cache-Control', 'public, max-age=31536000');

      return new NextResponse(response.data as unknown as ReadableStream, {
        status: 200,
        headers
      });

    } catch (error: any) {
      // 토큰 만료 에러 체크
      if (error.message?.includes('invalid_grant') || error.message?.includes('token expired')) {
        // 토큰 리프레시 시도
        const newOAuth2Client = await refreshAccessToken();
        const drive = google.drive({ version: 'v3', auth: newOAuth2Client });
        
        // 다시 한번 요청 시도
        return await GET(request, { params });
      }
      throw error;
    }

  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to proxy file', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
