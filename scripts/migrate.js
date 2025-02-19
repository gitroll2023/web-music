const fs = require('fs/promises');
const path = require('path');

async function migrateSongs() {
  try {
    // 기존 songs.json 읽기
    const filePath = path.join(process.cwd(), 'src/data/songs.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const oldSongs = JSON.parse(fileContent);

    // 새로운 형식으로 변환
    const newSongs = oldSongs.map((song) => {
      // ID 생성 (chapter-number 형식)
      const match = song.url.match(/\/chapter(\d+)\/(\d+-\d+)\.mp3$/);
      const id = match ? match[2] : `${song.chapter}-${Date.now()}`;

      // 가사 파일 경로 업데이트
      let lyrics = song.lyrics;
      if (lyrics && typeof lyrics === 'string' && lyrics.startsWith('/lyrics/')) {
        const lyricsFileName = lyrics.split('/').pop();
        lyrics = `/songs/chapter${song.chapter}/${lyricsFileName}`;
      }

      return {
        id,
        chapter: song.chapter,
        title: song.title,
        url: song.url,
        lyrics,
        isNew: song.isNew || false,
        genre: song.genre || 'unclassified',
        duration: song.duration
      };
    });

    // 챕터와 ID 기준으로 정렬
    newSongs.sort((a, b) => {
      if (a.chapter !== b.chapter) {
        return a.chapter - b.chapter;
      }
      return a.id.localeCompare(b.id);
    });

    // 백업 생성
    const backupPath = path.join(process.cwd(), 'src/data/songs.backup.json');
    await fs.writeFile(backupPath, fileContent);
    console.log('기존 파일이 백업되었습니다:', backupPath);

    // 새로운 형식으로 저장
    await fs.writeFile(filePath, JSON.stringify(newSongs, null, 2));
    console.log('마이그레이션이 완료되었습니다!');

    // 가사 파일 이동 안내
    console.log('\n가사 파일 이동 안내:');
    console.log('1. public/lyrics 폴더의 모든 가사 파일을 확인하세요.');
    console.log('2. 각 가사 파일을 public/songs/chapter{N}/ 폴더로 이동하세요.');
    console.log('3. 파일명이 {id}.txt 형식인지 확인하세요.\n');

    // 필요한 디렉토리 구조 출력
    console.log('필요한 디렉토리 구조:');
    for (let i = 1; i <= 22; i++) {
      console.log(`public/songs/chapter${i}/`);
    }

  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
  }
}

migrateSongs();
