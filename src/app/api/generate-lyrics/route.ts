import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash-lite-preview-02-05" });

const CHAPTER_SECTIONS: { [key: number]: string[] } = {
  1: ['1-3', '1-8', '9-20'],
  2: ['에베소교회', '서머나교회', '버가모교회', '두아디라교회'],
  3: ['사데교회', '빌라델비아교회', '라오디게아교회'],
  4: ['전체'],
  5: ['1-5', '6-14'],
  6: ['첫째인', '둘째인', '셋째인', '넷째인', '다섯째인'],
  7: ['1-8', '9-17'],
  8: ['1-5', '6-13'],
  9: ['다섯째 천사', '여섯째 천사'],
  10: ['전체']
};

export async function POST(request: Request) {
  try {
    const { chapter, genre } = await request.json();
    
    // revelation.json 읽기
    const filePath = path.join(process.cwd(), 'src', 'data', 'revelation.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const revelationData = JSON.parse(fileContents);
    
    // 해당 챕터의 구절들 가져오기
    const chapterVerses = revelationData[chapter.toString()];
    if (!chapterVerses) {
      throw new Error(`Chapter ${chapter} not found`);
    }
    
    // 섹션별로 구절 나누기
    const sections = CHAPTER_SECTIONS[chapter] || ['전체'];
    const selectedSections = sections.slice(0, 6); // 최대 6개 섹션만 사용
    
    // 각 섹션에 대해 가사 생성
    const cards = await Promise.all(selectedSections.map(async (section) => {
      let verseTexts = '';
      
      if (section === '전체') {
        // 전체 장의 구절을 모두 포함
        verseTexts = Object.values(chapterVerses).join(' ');
      } else if (section.includes('-')) {
        // 범위로 지정된 구절 (예: 1-3)
        const [start, end] = section.split('-').map(Number);
        for (let i = start; i <= end; i++) {
          if (chapterVerses[i.toString()]) {
            verseTexts += chapterVerses[i.toString()] + ' ';
          }
        }
      } else {
        // 특정 교회나 인 등의 섹션
        // 여기서는 전체 구절을 사용하고 섹션 이름을 프롬프트에 포함
        verseTexts = Object.values(chapterVerses).join(' ');
      }
      
      const prompt = `
You are tasked with creating song lyrics based on the following verses from Revelation chapter ${chapter}:

${section !== '전체' ? `[${section}]` : ''}
${verseTexts}

Requirements:
1. Format the lyrics using English section markers: [verse1], [verse2], [chorus], [bridge], etc.
2. DO NOT modify or paraphrase the biblical text. Use the exact verses as they are.
3. Genre: ${genre}
4. Organize the verses into a song structure while maintaining their original text.
5. For the style, describe the musical elements and end with BPM (e.g. "Modern worship with ambient pads, electric guitar leads, soft drums, 72 BPM")
6. Then explain in Korean why you chose this style and how it complements the lyrics (within 400 characters).

Output format:
---lyrics---
[lyrics content with English section markers]
---style---
[music style description ending with BPM]
---explanation---
[스타일 선택 이유와 가사와의 조화에 대한 설명 (한글)]
`;

      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        // 가사와 스타일 분리
        const [lyrics, styleAndExplanation] = text.split('---style---').map(s => s.trim());
        const cleanLyrics = lyrics.replace('---lyrics---', '').trim();
        const [style, explanation] = styleAndExplanation.split('---explanation---').map(s => s.trim());
        
        return {
          id: uuidv4(),
          lyrics: cleanLyrics,
          musicStyle: style || 'Style suggestion not available',
          explanation: explanation || 'Explanation not available',
          timestamp: new Date().toLocaleString(),
          section
        };
      } catch (error: any) {
        console.error('Error generating content:', error);
        
        if (error.status === 429) {
          return NextResponse.json(
            { message: '일일 AI 사용량이 초과되었습니다. 내일 다시 시도해주세요.' },
            { status: 429 }
          );
        }
        
        return NextResponse.json(
          { message: '가사 생성에 실패했습니다.' },
          { status: 500 }
        );
      }
    }));
    
    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error generating lyrics:', error);
    return NextResponse.json(
      { message: '가사 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
