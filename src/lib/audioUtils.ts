import * as mm from 'music-metadata';

export async function getAudioUrl(url: string): Promise<string> {
  if (!url) return '';
  
  try {
    // 서버 API를 통해 실제 오디오 URL 가져오기
    const response = await fetch(`/api/audio-url?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    if (data.url) {
      return data.url;
    }
    
    return url;
  } catch (error) {
    console.error('Error fetching audio URL:', error);
    return url;
  }
}

export async function getAudioDuration(buffer: Buffer): Promise<string> {
  try {
    const metadata = await mm.parseBuffer(buffer);
    const duration = metadata.format.duration || 0;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error getting audio duration:', error);
    return '0:00';
  }
}

// 디버깅을 위한 함수 추가
export function logAudioError(error: any) {
  console.log('Audio error details:', {
    name: error.name,
    message: error.message,
    code: error.code,
    networkState: error.target?.networkState,
    readyState: error.target?.readyState,
    src: error.target?.src
  });
}

// Google Drive URL을 스트리밍 가능한 URL로 변환
export function getStreamableUrl(driveFileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${driveFileId}`;
}