import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadFile, deleteFile, getImageUrl, getAudioUrl } from '@/utils/google-drive';
import path from 'path';
import { getAudioDuration } from '@/lib/audioUtils';

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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10'); // 한 번에 가져오는 곡 수 줄임
    const skip = (page - 1) * limit;

    // 첫 페이지일 때는 전체 수를 가져오지 않음
    const totalCount = page === 1 ? null : await prisma.song.count();

    // 모든 필드를 가져오기
    const songs = await prisma.song.findMany({
      take: limit,
      skip: skip,
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

    return NextResponse.json({
      songs,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: totalCount ? Math.ceil(totalCount / limit) : null
      }
    });
  } catch (error) {
    console.error('Error fetching songs:', error);
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
    const title = formData.get('title') as string;
    const artist = formData.get('artist') as string;
    const chapterId = formData.get('chapterId') as string;
    const lyrics = formData.get('lyrics') as string;
    const isNew = formData.get('isNew') === 'true';
    const driveFileId = formData.get('driveFileId') as string;
    const fileUrl = formData.get('fileUrl') as string;
    const duration = formData.get('duration') as string;
    const imageId = formData.get('imageId') as string;
    const imageUrl = formData.get('imageUrl') as string;

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
      imageUrl
    });

    // 필수 필드 검증
    if (!title || !chapterId) {
      console.error('Missing required fields:', { title, chapterId });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 장르 ID
    let genreId = formData.get('genreId')?.toString();
    console.log('Received genreId:', genreId);

    if (!genreId) {
      console.error('Genre ID is required');
      return NextResponse.json(
        { error: 'Genre ID is required' },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: 'Invalid chapter name format' },
        { status: 400 }
      );
    }

    // 해당 챕터의 기존 곡들 조회하여 다음 순번 결정
    const existingSongs = await prisma.song.findMany({
      where: { chapterId: chapter.id },
      orderBy: { fileName: 'desc' }
    });

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
    const fileName = `${chapterNumber}-${lastNumber + 1}`;
    console.log('Generated fileName:', fileName);

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
      fileName
    });

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
      }
    });

    console.log('Song created successfully:', song);

    return NextResponse.json(song);
  } catch (error: any) {
    console.error('Error creating song:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to create song' },
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

        // 오디오 파일을 버퍼로 변환
        console.log('Converting audio file to buffer...');
        const arrayBuffer = await audioFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log('Audio buffer size:', buffer.length);

        // 구글 드라이브에 업로드
        console.log('Uploading audio file to Google Drive...');
        const uploadResult = await uploadFile(buffer, audioFile.name, 'audio/mpeg');
        console.log('Upload result:', uploadResult);
        driveFileId = uploadResult;  // uploadResult가 이미 ID인지 확인
        console.log('Audio file uploaded successfully, driveFileId:', driveFileId);

        // 파일 URL 생성
        fileUrl = driveFileId ? await getAudioUrl(driveFileId) : null;
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

        console.log('Converting image file to buffer...');
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        console.log('Image buffer size:', imageBuffer.length);
        
        // 파일 확장자 추출 및 정규화
        let ext = path.extname(imageFile.name).toLowerCase();
        if (!ext || !['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
          // MIME 타입에 따라 확장자 설정
          ext = imageFile.type === 'image/jpeg' ? '.jpg'
              : imageFile.type === 'image/png' ? '.png'
              : '.gif';
        }
        
        const newFileName = `${existingSong.fileName}${ext}`;
        
        console.log('Uploading image file to Google Drive...');
        const imageFileId = await uploadFile(
          imageBuffer,
          newFileName,
          imageFile.type
        );
        console.log('Image upload result:', imageFileId);
        imageId = imageFileId;

        // 이미지 URL 생성
        if (imageId) {
          imageUrl = await getImageUrl(imageId);
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
    console.error('Error updating song:', error);
    return NextResponse.json(
      { error: 'Failed to update song' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const songId = searchParams.get('id');

    if (!songId) {
      return NextResponse.json(
        { error: 'Song ID is required' },
        { status: 400 }
      );
    }

    // 곡 정보 조회 - 모든 필드를 가져옴
    const song = await prisma.song.findUnique({
      where: { id: Number(songId) },
      include: {
        chapter: true,
        genre: true,
        popularSong: true
      }
    });

    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    console.log('Found song to delete:', song);

    // 구글 드라이브에서 오디오 파일 삭제
    if (song.driveFileId) {
      try {
        console.log('Deleting audio file:', song.driveFileId);
        await deleteFile(song.driveFileId);
        console.log('Audio file deleted successfully');
      } catch (error) {
        console.error('Error deleting audio file:', error);
        throw error; // 파일 삭제 실패시 중단
      }
    }

    // 구글 드라이브에서 이미지 파일 삭제
    if (song.imageId) {
      try {
        console.log('Deleting image file:', song.imageId);
        await deleteFile(song.imageId);
        console.log('Image file deleted successfully');
      } catch (error) {
        console.error('Error deleting image file:', error);
        throw error; // 파일 삭제 실패시 중단
      }
    }

    // 모든 파일이 성공적으로 삭제된 후에만 DB에서 삭제
    await prisma.song.delete({
      where: { id: Number(songId) }
    });

    console.log('Song deleted from database');
    return NextResponse.json({ message: 'Song and associated files deleted successfully' });
  } catch (error) {
    console.error('Error in delete operation:', error);
    return NextResponse.json(
      { error: 'Failed to delete song and associated files' },
      { status: 500 }
    );
  }
}