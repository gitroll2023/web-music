import type { Metadata } from 'next';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';

async function getSong(id: string) {
  const song = await prisma.song.findUnique({
    where: { id: parseInt(id) },
    include: {
      chapter: true,
    },
  });
  return song;
}

// Dynamic OG metadata generation
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const song = await getSong(params.id);

  if (!song) {
    return {
      title: '곡을 찾을 수 없습니다 - NAJU INFO',
    };
  }

  const chapterName = song.chapter?.name ?? '';
  const description = chapterName
    ? `${chapterName} - ${song.title}`
    : song.title;

  return {
    title: `${song.title} - NAJU INFO`,
    description,
    openGraph: {
      title: song.title,
      description,
      type: 'music.song',
      url: `/song/${song.id}`,
      ...(song.imageUrl
        ? {
            images: [
              {
                url: song.imageUrl,
                alt: song.title,
              },
            ],
          }
        : {}),
    },
  };
}

export default async function SongDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const song = await getSong(params.id);
  if (!song) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 앨범 아트 */}
      <div className="relative w-full pt-[100%]">
        {song.imageUrl ? (
          <Image
            src={song.imageUrl}
            alt={song.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gray-800" />
        )}
      </div>

      {/* 곡 정보 */}
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold mb-2">{song.title}</h1>
        <div className="text-gray-400 mb-6">
          {song.artist}
          {song.artist && song.chapter?.name && ' · '}
          {song.chapter?.name}
        </div>

        {/* 가사 */}
        {song.lyrics && (
          <div className="mt-8 text-gray-300 whitespace-pre-line leading-relaxed">
            {song.lyrics}
          </div>
        )}
      </div>
    </div>
  );
}
