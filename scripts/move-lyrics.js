const fs = require('fs/promises');
const path = require('path');

async function moveLyrics() {
  try {
    // 1. 필요한 디렉토리 생성
    for (let i = 1; i <= 22; i++) {
      const chapterDir = path.join(process.cwd(), 'public', 'songs', `chapter${i}`);
      try {
        await fs.mkdir(chapterDir, { recursive: true });
        console.log(`디렉토리 생성 완료: ${chapterDir}`);
      } catch (err) {
        if (err.code !== 'EEXIST') {
          throw err;
        }
      }
    }

    // 2. songs.json 읽기
    const songsPath = path.join(process.cwd(), 'src', 'data', 'songs.json');
    const songsContent = await fs.readFile(songsPath, 'utf-8');
    const songs = JSON.parse(songsContent);

    // 3. lyrics 폴더의 모든 파일 읽기
    const lyricsDir = path.join(process.cwd(), 'public', 'lyrics');
    const files = await fs.readdir(lyricsDir);

    // 4. 각 가사 파일 이동
    for (const song of songs) {
      if (song.lyrics && typeof song.lyrics === 'string') {
        const oldLyricsFile = song.lyrics.startsWith('/') ? song.lyrics.slice(1) : song.lyrics;
        const fileName = path.basename(oldLyricsFile);
        const oldPath = path.join(process.cwd(), 'public', oldLyricsFile);
        const newPath = path.join(process.cwd(), 'public', 'songs', `chapter${song.chapter}`, `${song.id}.txt`);

        try {
          // 파일 존재 여부 확인
          await fs.access(oldPath);
          
          // 파일 이동
          await fs.copyFile(oldPath, newPath);
          console.log(`가사 파일 이동 완료: ${oldPath} -> ${newPath}`);
          
          // 원본 파일 삭제
          await fs.unlink(oldPath);
        } catch (err) {
          if (err.code === 'ENOENT') {
            console.log(`파일을 찾을 수 없음: ${oldPath}`);
          } else {
            throw err;
          }
        }
      }
    }

    // 5. 빈 lyrics 디렉토리 삭제
    try {
      await fs.rmdir(lyricsDir);
      console.log('빈 lyrics 디렉토리 삭제 완료');
    } catch (err) {
      if (err.code !== 'ENOTEMPTY') {
        console.log('lyrics 디렉토리가 비어있지 않습니다. 수동으로 확인해주세요.');
      }
    }

    console.log('\n작업이 완료되었습니다!');
    console.log('1. public/songs/chapter{N}/ 폴더에 가사 파일들이 이동되었습니다.');
    console.log('2. 각 가사 파일은 해당 노래의 ID와 동일한 이름을 가집니다.');
    console.log('3. 원본 lyrics 폴더의 파일들은 삭제되었습니다.');

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

moveLyrics();
