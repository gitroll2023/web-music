import { handleFileUpload } from '../../utils/fileUpload';

describe('파일 업로드 테스트', () => {
  const testChapterId = 'test-chapter-id';

  beforeEach(() => {
    // fetch 모의 구현
    global.fetch = jest.fn().mockImplementation((url, options) => {
      if (url === '/api/auth/get-access-token') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ accessToken: 'test-access-token' })
        });
      }

      if (url.startsWith('https://www.googleapis.com/upload/drive/v3/files')) {
        const formData = options.body as FormData;
        const metadata = JSON.parse(formData.get('metadata').text());
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'test-file-id',
            name: metadata.name,
            webViewLink: 'https://drive.google.com/file/d/test-file-id/view'
          })
        });
      }

      if (url.startsWith('https://www.googleapis.com/drive/v3/files/') && url.endsWith('/permissions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'test-permission-id' })
        });
      }

      return Promise.reject(new Error('Not found'));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('오디오 파일 업로드', async () => {
    // 테스트 파일 생성
    const file = new File(['test audio content'], 'test.mp3', { type: 'audio/mpeg' });
    
    // 파일 업로드 함수 호출
    const result = await handleFileUpload(file, 'audio', testChapterId);

    // 결과 검증
    expect(result).toEqual({
      fileId: 'test-file-id',
      fileUrl: 'https://drive.google.com/file/d/test-file-id/view',
      fileName: `${testChapterId}_audio_test.mp3`
    });
  });

  it('이미지 파일 업로드', async () => {
    // 테스트 파일 생성
    const file = new File(['test image content'], 'test.jpg', { type: 'image/jpeg' });
    
    // 파일 업로드 함수 호출
    const result = await handleFileUpload(file, 'image', testChapterId);

    // 결과 검증
    expect(result).toEqual({
      fileId: 'test-file-id',
      fileUrl: 'https://drive.google.com/file/d/test-file-id/view',
      fileName: `${testChapterId}_image_test.jpg`
    });
  });

  it('파일이나 챕터가 없을 경우 null 반환', async () => {
    const result = await handleFileUpload(null, 'audio');
    expect(result).toBeNull();
  });

  it('업로드 실패 시 에러 처리', async () => {
    // fetch 모의 구현 재설정
    global.fetch = jest.fn().mockImplementation(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({
        error: {
          message: 'Test error message'
        }
      })
    }));

    const file = new File(['test content'], 'test.mp3', { type: 'audio/mpeg' });
    const result = await handleFileUpload(file, 'audio', testChapterId);
    expect(result).toBeNull();
  });
});
