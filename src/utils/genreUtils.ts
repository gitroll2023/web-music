export const GENRE_MAP: { [key: string]: string } = {
  'acoustic': '어쿠스틱',
  'hiphop': '힙합',
  'kids': '어린이',
  'upbeat': '신나는',
  'epic': '웅장한',
  'trot': '트로트',
  'indie': '인디',
  'ccm': 'CCM',
  'other': '기타',
  'unclassified': '미분류'
};

export const getGenreLabel = (genre: string): string => {
  return GENRE_MAP[genre] || '미분류';
};
