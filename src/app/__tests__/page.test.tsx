import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import Home from '../page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('Home Component', () => {
  const mockSong = {
    id: 1,
    title: 'Test Song',
    fileUrl: 'http://example.com/test.mp3',
    lyrics: 'Test lyrics',
    createdAt: new Date(),
    updatedAt: new Date(),
    chapterId: 1,
    genreId: 1,
    chapter: {
      id: 1,
      name: 'Test Chapter',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    genre: {
      id: 1,
      name: 'Test Genre',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetch response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([mockSong]),
      })
    ) as jest.Mock;
  });

  test('시간 이동 시 오디오가 올바르게 업데이트되어야 함', async () => {
    const { getByRole } = render(<Home />);

    // 데이터 로딩 대기
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // 시간 이동
    const progressBar = getByRole('slider');
    await act(async () => {
      fireEvent.change(progressBar, { target: { value: '50' } });
    });

    // 검증
    const audio = document.querySelector('audio') as HTMLAudioElement;
    expect(audio.currentTime).toBe(50);
  });

  test('재생/일시정지가 올바르게 작동해야 함', async () => {
    const { getByRole } = render(<Home />);

    // 데이터 로딩 대기
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // 재생 버튼 클릭
    const playButton = getByRole('button', { name: /재생|일시정지/i });
    await act(async () => {
      fireEvent.click(playButton);
    });

    // 검증
    const audio = document.querySelector('audio') as HTMLAudioElement;
    expect(audio.play).toHaveBeenCalled();

    // 일시정지 버튼 클릭
    await act(async () => {
      fireEvent.click(playButton);
    });

    expect(audio.pause).toHaveBeenCalled();
  });
});
