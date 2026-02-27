import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadFile, deleteFile, getImageUrl, getAudioUrl } from '@/utils/google-drive';
import path from 'path';
import { getAudioDuration } from '@/lib/audioUtils';
import { logApiError } from '@/lib/apiResponse';

// 타입 정의 추가
type RevelationFlags = {
  isRevelationChapter: boolean;
  isRevelationKeyVerse: boolean;
  isRevelationTitle: boolean;
};

// 챕터의 다음 파일 번호를 찾는 함수
async function getNextFileNumber(chapterName: string): Promise<number> {
  // 해당 챕터의 모든 곡을 가져옴
  const songs = await prisma.song.findMany({
    where: {
      chapter: {
        name: chapterName
      }
    }
  });

  // 파일명에서 번호를 추출하여 가장 큰 번호를 찾음
  let maxNumber = 0;
  songs.forEach(song => {
    if (song.fileName) {
      const match = song.fileName.match(/\d+$/);
      if (match) {
        const number = parseInt(match[0], 10);
        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    }
  });

  return maxNumber + 1;
}

// 챕터 이름에서 장 번호를 추출하는 함수
function getChapterNumber(chapterName: string): string {
  const match = chapterName.match(/\d+/);
  return match ? match[0] : '';
}

// 장르 ID 정규화 함수
function normalizeGenreId(name: string): string {
  return name.toLowerCase()
    .replace(/\s+/g, '_')  // 공백을 _로 변경
    .replace(/[^a-z0-9_]/g, '');  // 알파벳, 숫자, _ 외 모든 문자 제거
}

// 장르 이름 정규화 함수
function normalizeGenreName(name: string): string {
  // 첫 글자를 대문자로
  return name.trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export async function GET(request: Request) {
  try {
    // 모든 곡을 한 번에 가져오기
    const songs = await prisma.song.findMany({
      include: {
        chapter: true,
        genre: true,
        popularSong: true
      },
      orderBy: {
        chapter: {
          name: 'asc'
        }
      }
    });

    console.log(`총 ${songs.length}개의 노래 데이터를 조회했습니다.`);
    
    // 장르 데이터 확인
    const songsWithGenre = songs.filter(song => song.genre);
    console.log(`장르 정보가 있는 노래: ${songsWithGenre.length}개`);
    
    if (songsWithGenre.length > 0) {
      console.log('장르 예시:', songsWithGenre.slice(0, 3).map(song => ({
        songId: song.id,
        genreId: song.genre?.id,
        genreName: song.genre?.name
      })));
    }

    // 장르 정보가 누락된 경우 기본 장르 할당
    const defaultGenre = await prisma.genre.findFirst({
      where: { id: 'ccm' }
    }) || { id: 'ccm', name: 'CCM', createdAt: new Date(), updatedAt: new Date() };
    
    // 각 노래에 장르 정보 확인 및 기본값 할당
    const processedSongs = songs.map(song => {
      // 장르 정보가 없으면 기본 장르 할당
      if (!song.genre) {
        console.log(`노래 ID ${song.id}에 장르 정보가 없어 기본 장르 할당`);
        return {
          ...song,
          genre: defaultGenre
        };
      }
      return song;
    });

    // 계시록 카테고리 필드를 포함한 응답 데이터 생성
    const songsWithFlags = await Promise.all(processedSongs.map(async (song) => {
      // 각 곡에 대해 계시록 카테고리 필드 값을 직접 조회
      const songWithFlags = await prisma.$queryRaw<RevelationFlags[]>`
        SELECT 
          "is_revelation_chapter" as "isRevelationChapter", 
          "is_revelation_key_verse" as "isRevelationKeyVerse", 
          "is_revelation_title" as "isRevelationTitle"
        FROM "songs"
        WHERE "id" = ${song.id}
      `;
      
      // 쿼리 결과는 배열로 반환되므로 첫 번째 항목 사용
      const flags = songWithFlags[0] || { isRevelationChapter: false, isRevelationKeyVerse: false, isRevelationTitle: false };
      
      // 신규 곡 여부 - 오직 isNew 플래그가 true인 경우에만
      const isNewByCriteria = song.isNew === true;
      
      // 원본 곡 데이터와 계시록 카테고리 필드 병합
      return {
        ...song,
        isRevelationChapter: flags.isRevelationChapter,
        isRevelationKeyVerse: flags.isRevelationKeyVerse,
        isRevelationTitle: flags.isRevelationTitle,
        isNew: isNewByCriteria
      };
    }));

    // 신규 곡 목록 확인 (노래 ID 기준 정렬)
    const sortedByCreatedAt = [...songsWithFlags].sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // 최종 결과 (원래 isNew 플래그만 사용)
    const finalSongsWithFlags = songsWithFlags;
    
    // 신규 곡 개수 확인
    const newSongsCount = finalSongsWithFlags.filter(song => song.isNew).length;
    console.log(`신규 곡 개수: ${newSongsCount}개`);

    return NextResponse.json({ songs: finalSongsWithFlags });
  } catch (error) {
    logApiError('GET /api/songs', error);
    return NextResponse.json(
      { error: 'Failed to fetch songs' },
      { status: 500 }
    );
  }
}

// 타임스탬프 파싱 함수
function parseLyricsTimestamps(lyrics: string) {
  const lines = lyrics.split('\n');
  const timestamps: { start: number; text: string }[] = [];
  let currentTime = 0;

  lines.forEach(line => {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const centiseconds = parseInt(match[3], 10);
      const text = match[4].trim();
      
      currentTime = (minutes * 60 + seconds) * 1000 + centiseconds * 10;
      
      if (text) {
        timestamps.push({
          start: currentTime,
          text: text
        });
      }
    }
  });

  return timestamps.length > 0 ? JSON.stringify(timestamps) : null;
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/songs - Start');
    const formData = await request.formData();
    
    // FormData 전체 내용 로깅
    const formDataEntries = Array.from(formData.entries());
    console.log('FormData entries:', formDataEntries.map(([key, value]) => {
      if (value instanceof File) {
        return [key, { name: value.name, type: value.type, size: value.size }];
      }
      return [key, value];
    }));
    
    // 기본 정보 추출
    const rawTitle = formData.get('title') as string;
    const artist = formData.get('artist') as string;
    const chapterId = formData.get('chapterId') as string;
    const rawLyrics = formData.get('lyrics') as string;
    const isNew = formData.get('isNew') === 'true';
    const driveFileId = formData.get('driveFileId') as string;
    let fileUrl = formData.get('fileUrl') as string;
    const duration = formData.get('duration') as string;
    const imageId = formData.get('imageId') as string;
    let imageUrl = formData.get('imageUrl') as string;

    // 계시록 카테고리 필드 추가
    const isRevelationChapter = formData.get('isRevelationChapter') === 'true';
    const isRevelationKeyVerse = formData.get('isRevelationKeyVerse') === 'true';
    const isRevelationTitle = formData.get('isRevelationTitle') === 'true';

    // ===== 입력값 검증 및 정제 (Input Validation & Sanitization) =====

    // 제목 검증: 필수, 최대 200자
    if (!rawTitle || typeof rawTitle !== 'string' || rawTitle.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    const title = rawTitle.trim();
    if (title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be 200 characters or less' },
        { status: 400 }
      );
    }

    // chapterId 검증: 필수, 유효한 숫자
    if (!chapterId) {
      console.error('Missing required field: chapterId');
      return NextResponse.json(
        { error: 'Chapter ID is required' },
        { status: 400 }
      );
    }
    const chapterIdNum = parseInt(chapterId, 10);
    if (isNaN(chapterIdNum) || chapterIdNum <= 0) {
      return NextResponse.json(
        { error: 'Chapter ID must be a valid positive number' },
        { status: 400 }
      );
    }

    // 장르 ID 검증: 필수, 비어있지 않은 문자열
    let genreId = formData.get('genreId')?.toString();
    console.log('Received genreId:', genreId);

    if (!genreId || typeof genreId !== 'string' || genreId.trim().length === 0) {
      console.error('Genre ID is required');
      return NextResponse.json(
        { error: 'Genre ID is required and must be a non-empty string' },
        { status: 400 }
      );
    }
    genreId = genreId.trim();

    // 가사 정제: trim, 최대 10000자 제한
    let lyrics = rawLyrics;
    if (lyrics && typeof lyrics === 'string') {
      lyrics = lyrics.trim();
      if (lyrics.length > 10000) {
        lyrics = lyrics.substring(0, 10000);
        console.log('Lyrics truncated to 10000 characters');
      }
    }

    // ===== 검증 완료 =====

    // URL이 없으면 생성
    if (driveFileId && !fileUrl) {
      fileUrl = `https://drive.google.com/uc?export=view&id=${driveFileId}`;
      console.log('Generated audio URL:', fileUrl);
    }
    if (imageId && !imageUrl) {
      imageUrl = `https://drive.google.com/uc?export=view&id=${imageId}`;
      console.log('Generated image URL:', imageUrl);
    }

    console.log('Extracted data:', {
      title,
      artist,
      chapterId,
      lyrics: lyrics?.substring(0, 100) + '...',
      isNew,
      driveFileId,
      fileUrl,
      duration,
      imageId,
      imageUrl,
      isRevelationChapter,
      isRevelationKeyVerse,
      isRevelationTitle
    });

    // 장르가 존재하는지 확인
    const genre = await prisma.genre.findUnique({
      where: { id: genreId }
    });

    if (!genre) {
      console.error('Genre not found:', genreId);
      return NextResponse.json(
        { error: 'Genre not found' },
        { status: 400 }
      );
    }

    console.log('Using genre:', genre);

    // 챕터 찾기
    console.log('Finding chapter with ID:', chapterId);
    const chapter = await prisma.chapter.findUnique({
      where: { id: parseInt(chapterId) },
      include: {
        songs: true
      }
    });

    if (!chapter) {
      console.error('Chapter not found:', chapterId);
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    console.log('Found chapter:', chapter);

    // 챕터 번호 추출 (예: "계시록 22장" -> "22")
    const chapterNumber = chapter.name.match(/\d+/)?.[0];
    if (!chapterNumber) {
      console.error('Invalid chapter name format:', chapter.name);
      // 챕터 이름에 숫자가 없어도 계속 진행하도록 수정
      // 대신 기본값으로 'ch'를 사용
      const safeChapterNumber = 'ch';
      console.log('Using default chapter prefix:', safeChapterNumber);
      
      // 파일명 처리: formData에서 fileName이 제공되면 그것을 사용하고, 없으면 자동 생성
      let fileName = formData.get('fileName')?.toString();
      if (!fileName || fileName.trim() === '') {
        // 새로운 파일명 생성 (예: "ch-1")
        fileName = `${safeChapterNumber}-1`;
        console.log('Generated fileName with default prefix:', fileName);
      } else {
        // 사용자가 입력한 파일명을 그대로 사용 (검증 로직 없음)
        console.log('Using provided fileName:', fileName);
      }

      // 여기서 곡 생성 로직 계속 진행
      console.log('Creating song with data:', {
        title,
        artist,
        chapterId,
        genreId,
        lyrics: lyrics?.substring(0, 100) + '...',
        isNew,
        driveFileId,
        fileUrl,
        duration,
        imageId,
        imageUrl,
        fileName,
        isRevelationChapter,
        isRevelationKeyVerse,
        isRevelationTitle
      });

      // 기본 필드로 곡 생성
      const song = await prisma.song.create({
        data: {
          title,
          artist,
          chapterId: parseInt(chapterId),
          genreId,
          lyrics,
          isNew,
          driveFileId,
          fileUrl,
          duration: duration ? duration : null,
          imageId,
          imageUrl,
          fileName
        },
        include: {
          chapter: true,
          genre: true
        }
      });

      // 계시록 카테고리 필드 업데이트 코드 계속 진행...
      if (isRevelationChapter || isRevelationKeyVerse || isRevelationTitle) {
        try {
          console.log('SQL 쿼리 실행 시작 (POST):', {
            id: song.id,
            isRevelationChapter,
            isRevelationKeyVerse,
            isRevelationTitle,
            rawValues: {
              isRevelationChapter: formData.get('isRevelationChapter'),
              isRevelationKeyVerse: formData.get('isRevelationKeyVerse'),
              isRevelationTitle: formData.get('isRevelationTitle')
            }
          });
          
          // 더 안전한 방식으로 SQL 쿼리 실행
          await prisma.$executeRaw`
            UPDATE "songs"
            SET 
              "is_revelation_chapter" = ${isRevelationChapter},
              "is_revelation_key_verse" = ${isRevelationKeyVerse},
              "is_revelation_title" = ${isRevelationTitle}
            WHERE "id" = ${song.id}
          `;
          
          console.log('SQL 쿼리 실행 완료 (POST)');
        } catch (sqlError) {
          console.error('SQL 쿼리 실행 중 오류 발생 (POST):', sqlError);
        }

        // 업데이트된 곡 다시 조회
        const updatedSong = await prisma.song.findUnique({
          where: { id: song.id },
          include: {
            chapter: true,
            genre: true,
            popularSong: true
          }
        });
        
        console.log('최종 생성된 곡 (POST):', {
          id: updatedSong?.id,
          title: updatedSong?.title,
          // 타입스크립트 오류를 피하기 위해 any 타입으로 변환
          isRevelationChapter: (updatedSong as any)?.isRevelationChapter,
          isRevelationKeyVerse: (updatedSong as any)?.isRevelationKeyVerse,
          isRevelationTitle: (updatedSong as any)?.isRevelationTitle
        });

        return NextResponse.json(updatedSong);
      }

      console.log('Song created successfully:', song);
      return NextResponse.json(song);
    }

    // 챕터 번호가 있는 경우(이전 코드와 동일하게 계속 진행)
    // 해당 챕터의 기존 곡들 조회하여 다음 순번 결정
    const existingSongs = await prisma.song.findMany({
      where: { chapterId: chapter.id },
      orderBy: { fileName: 'desc' }
    });

    // 파일명 처리: formData에서 fileName이 제공되면 그것을 사용하고, 없으면 자동 생성
    let fileName = formData.get('fileName')?.toString();
    if (!fileName || fileName.trim() === '') {
      // 현재 챕터의 마지막 파일 번호 찾기
      let lastNumber = 0;
      for (const song of existingSongs) {
        const match = song.fileName?.match(new RegExp(`^${chapterNumber}-(\\d+)$`));
        if (match) {
          const num = parseInt(match[1]);
          if (num > lastNumber) lastNumber = num;
        }
      }

      // 새로운 파일명 생성 (예: "22-1", "22-2" 등)
      fileName = `${chapterNumber}-${lastNumber + 1}`;
      console.log('Generated fileName:', fileName);
    } else {
      // 사용자가 입력한 파일명을 그대로 사용 (검증 로직 없음)
      console.log('Using provided fileName:', fileName);
    }

    // 곡 생성
    console.log('Creating song with data:', {
      title,
      artist,
      chapterId,
      genreId,
      lyrics: lyrics?.substring(0, 100) + '...',
      isNew,
      driveFileId,
      fileUrl,
      duration,
      imageId,
      imageUrl,
      fileName,
      isRevelationChapter,
      isRevelationKeyVerse,
      isRevelationTitle
    });

    // 기본 필드로 곡 생성
    const song = await prisma.song.create({
      data: {
        title,
        artist,
        chapterId: parseInt(chapterId),
        genreId,
        lyrics,
        isNew,
        driveFileId,
        fileUrl,
        duration: duration ? duration : null,
        imageId,
        imageUrl,
        fileName
      },
      include: {
        chapter: true,
        genre: true
      }
    });

    // 계시록 카테고리 필드 업데이트 - 직접 SQL 쿼리 실행
    if (isRevelationChapter || isRevelationKeyVerse || isRevelationTitle) {
      try {
        console.log('SQL 쿼리 실행 시작 (POST):', {
          id: song.id,
          isRevelationChapter,
          isRevelationKeyVerse,
          isRevelationTitle,
          rawValues: {
            isRevelationChapter: formData.get('isRevelationChapter'),
            isRevelationKeyVerse: formData.get('isRevelationKeyVerse'),
            isRevelationTitle: formData.get('isRevelationTitle')
          }
        });
        
        // 더 안전한 방식으로 SQL 쿼리 실행
        await prisma.$executeRaw`
          UPDATE "songs"
          SET 
            "is_revelation_chapter" = ${isRevelationChapter},
            "is_revelation_key_verse" = ${isRevelationKeyVerse},
            "is_revelation_title" = ${isRevelationTitle}
          WHERE "id" = ${song.id}
        `;
        
        console.log('SQL 쿼리 실행 완료 (POST)');
      } catch (sqlError) {
        console.error('SQL 쿼리 실행 중 오류 발생 (POST):', sqlError);
      }

      // 업데이트된 곡 다시 조회
      const updatedSong = await prisma.song.findUnique({
        where: { id: song.id },
        include: {
          chapter: true,
          genre: true,
          popularSong: true
        }
      });
      
      console.log('최종 생성된 곡 (POST):', {
        id: updatedSong?.id,
        title: updatedSong?.title,
        // 타입스크립트 오류를 피하기 위해 any 타입으로 변환
        isRevelationChapter: (updatedSong as any)?.isRevelationChapter,
        isRevelationKeyVerse: (updatedSong as any)?.isRevelationKeyVerse,
        isRevelationTitle: (updatedSong as any)?.isRevelationTitle
      });

      return NextResponse.json(updatedSong);
    }

    console.log('Song created successfully:', song);
    return NextResponse.json(song);
  } catch (error: unknown) {
    logApiError('POST /api/songs', error);
    const message =
      error instanceof Error ? error.message : 'Failed to create song';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const artist = formData.get('artist') as string;
    const chapterName = formData.get('chapter') as string;
    const genreId = formData.get('genre') as string;
    const lyrics = formData.get('lyrics') as string;
    const audioFile = formData.get('audioFile') as File | null;
    const imageFile = formData.get('imageFile') as File | null;

    console.log('Received files:', {
      audioFile: audioFile ? {
        name: audioFile.name,
        type: audioFile.type,
        size: audioFile.size
      } : null,
      imageFile: imageFile ? {
        name: imageFile.name,
        type: imageFile.type,
        size: imageFile.size
      } : null
    });

    // 챕터 찾기 또는 생성
    let chapterRecord = await prisma.chapter.findFirst({
      where: { name: chapterName }
    });

    if (!chapterRecord) {
      chapterRecord = await prisma.chapter.create({
        data: { name: chapterName }
      });
    }

    // 기존 곡 정보 가져오기
    const existingSong = await prisma.song.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSong) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    let driveFileId = existingSong.driveFileId;
    let imageId = existingSong.imageId;
    let fileUrl = existingSong.fileUrl;
    let imageUrl = existingSong.imageUrl;
    let duration: string | null = existingSong.duration;

    // 오디오 파일 처리
    if (audioFile) {
      try {
        console.log('Processing files:', {
          audioFile: { name: audioFile.name, type: audioFile.type, size: audioFile.size },
          imageFile: imageFile
        });

        // 기존 오디오 파일 삭제
        if (existingSong.driveFileId) {
          try {
            await deleteFile(existingSong.driveFileId);
            console.log('Old audio file deleted from Google Drive:', existingSong.driveFileId);
          } catch (error) {
            console.error('Error deleting old audio file:', error);
          }
        }

        // 오디오 파일을 버퍼로 변환
        console.log('Converting audio file to buffer...');
        const arrayBuffer = await audioFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log('Audio buffer size:', buffer.length);

        // 구글 드라이브에 업로드 (기존 파일명 사용)
        const fileName = `${existingSong.fileName}.mp3`;
        console.log('Uploading audio file to Google Drive with name:', fileName);
        const uploadResult = await uploadFile(buffer, fileName, 'audio/mpeg');
        console.log('Upload result:', uploadResult);
        driveFileId = uploadResult;
        console.log('Audio file uploaded successfully, driveFileId:', driveFileId);

        // 파일 URL 생성
        fileUrl = driveFileId ? `https://drive.google.com/uc?export=view&id=${driveFileId}` : null;
        console.log('Generated audio URL:', fileUrl);

        // 오디오 길이 가져오기
        duration = await getAudioDuration(buffer);
        console.log('Audio duration:', duration);
      } catch (error) {
        console.error('Error uploading audio file:', error);
        return NextResponse.json(
          { message: 'Failed to upload audio file' },
          { status: 500 }
        );
      }
    } else {
      console.log('No audio file provided');
    }

    // 이미지 파일 업로드
    if (imageFile) {
      try {
        // 이미지 파일 형식 검증
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validImageTypes.includes(imageFile.type)) {
          return NextResponse.json(
            { message: 'Invalid image format. Only JPG, PNG, and GIF are allowed.' },
            { status: 400 }
          );
        }

        // 기존 이미지 삭제
        if (existingSong.imageId) {
          try {
            await deleteFile(existingSong.imageId);
            console.log('Old image file deleted from Google Drive:', existingSong.imageId);
          } catch (error) {
            console.error('Error deleting old image file:', error);
          }
        }

        console.log('Converting image file to buffer...');
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        console.log('Image buffer size:', imageBuffer.length);
        
        // 파일 확장자 추출 및 정규화
        let ext = path.extname(imageFile.name).toLowerCase();
        if (!ext || !['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
          ext = imageFile.type === 'image/jpeg' ? '.jpg'
              : imageFile.type === 'image/png' ? '.png'
              : '.gif';
        }
        
        // 기존 파일명 사용
        const fileName = `${existingSong.fileName}${ext}`;
        console.log('Uploading image file to Google Drive with name:', fileName);
        
        const imageFileId = await uploadFile(
          imageBuffer,
          fileName,
          imageFile.type
        );
        console.log('Image upload result:', imageFileId);
        imageId = imageFileId;

        // 이미지 URL 생성
        if (imageId) {
          imageUrl = `https://drive.google.com/uc?export=view&id=${imageId}`;
          console.log('Generated image URL:', imageUrl);
        }
      } catch (error) {
        console.error('Error uploading image file:', error);
        return NextResponse.json(
          { message: 'Failed to upload image file' },
          { status: 500 }
        );
      }
    } else {
      console.log('No image file provided');
    }

    // 가사에서 타임스탬프 파싱
    const timestamps = parseLyricsTimestamps(lyrics);

    // unknown 장르가 없으면 생성
    let finalGenreId = genreId;
    if (!finalGenreId) {
      const unknownGenre = await prisma.genre.findUnique({
        where: { id: 'unknown' }
      });

      if (!unknownGenre) {
        await prisma.genre.create({
          data: {
            id: 'unknown',
            name: '미분류'
          }
        });
      }
      finalGenreId = 'unknown';
    }

    // 곡 업데이트
    const updatedSong = await prisma.song.update({
      where: { id: Number(id) },
      data: {
        title: title || undefined,
        artist: artist || null,
        driveFileId: driveFileId || undefined,
        fileUrl: fileUrl || undefined,
        duration: duration ? String(duration) : null,
        imageId: imageId || undefined,
        imageUrl: imageUrl || undefined,
        lyrics: lyrics || null,
        chapterId: chapterRecord.id,
        genreId: finalGenreId,
        isNew: formData.get('isNew') === 'true'
      },
      include: {
        chapter: true,
        genre: true,
        popularSong: true
      }
    });

    return NextResponse.json(updatedSong);
  } catch (error) {
    logApiError('PUT /api/songs', error);
    return NextResponse.json(
      { error: 'Failed to update song' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Song ID is required' },
        { status: 400 }
      );
    }

    // 기존 곡 찾기
    const song = await prisma.song.findUnique({
      where: { id: parseInt(id) }
    });

    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    // 구글 드라이브에서 파일 삭제
    if (song.driveFileId) {
      try {
        await deleteFile(song.driveFileId);
        console.log('Audio file deleted from Google Drive:', song.driveFileId);
      } catch (error) {
        console.error('Error deleting audio file:', error);
      }
    }

    // 구글 드라이브에서 이미지 삭제
    if (song.imageId) {
      try {
        await deleteFile(song.imageId);
        console.log('Image file deleted from Google Drive:', song.imageId);
      } catch (error) {
        console.error('Error deleting image file:', error);
      }
    }

    // DB에서 곡 삭제
    await prisma.song.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: 'Song deleted successfully' });
  } catch (error) {
    logApiError('DELETE /api/songs', error);
    return NextResponse.json(
      { error: 'Failed to delete song' },
      { status: 500 }
    );
  }
}