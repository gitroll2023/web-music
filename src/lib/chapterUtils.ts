import { Chapter } from '@/types';

/**
 * 챕터 번호에서 챕터와 절을 추출합니다.
 */
export const extractChapterNumber = (order: number): number => {
  return Math.floor(order / 100);
};

/**
 * 챕터 이미지 URL을 가져옵니다.
 * 이미지가 없는 경우 빈 문자열을 반환합니다.
 */
export const getChapterImage = async (chapterNumber: number): Promise<string> => {
  try {
    // 이미지 존재 여부를 확인합니다
    const response = await fetch(`/images/chapters/${chapterNumber}.jpg`, { method: 'HEAD' });
    if (response.ok) {
      return `/images/chapters/${chapterNumber}.jpg`;
    }
    return '';
  } catch {
    return '';
  }
};

/**
 * 챕터 번호로 챕터 제목을 생성합니다.
 */
export const getChapterTitle = (chapterNumber: number): string => {
  return `Chapter ${chapterNumber}`;
};
