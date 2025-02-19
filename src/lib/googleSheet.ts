import type { Song } from '@/types';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

export async function getSongs(): Promise<Song[]> {
  try {
    const response = await fetch(SHEET_URL);
    const text = await response.text();
    const jsonString = text.substring(47).slice(0, -2);
    const json = JSON.parse(jsonString);
    
    const rows = json.table.rows;
    return rows.map((row: any) => {
      // null 체크를 추가하고 값이 없는 경우 빈 문자열 반환
      const cells = row.c || [];
      const values = cells.map((cell: any) => cell?.v ?? '');
      
      // 스프레드시트의 열 순서대로 데이터 매핑
      if (values[0]) {  // 순서가 있는 경우만 처리
        return {
          order: values[0],          // 순서
          chapter: parseInt(values[1]), // 장
          title: values[2],          // 제목
          url: values[3],            // URL
          duration: values[4]         // 재생시간
        };
      }
      return null;
    }).filter(Boolean); // null 값 제거
  } catch (error) {
    console.error('Error fetching songs:', error);
    return [];
  }
} 