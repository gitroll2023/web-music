/**
 * Tests for GET /api/songs route handler
 *
 * We mock the Prisma client so that tests do not require a real database.
 *
 * IMPORTANT: next/jest maps 'next/server' via modularizeImports, transforming
 * `import { NextResponse } from 'next/server'` into
 * `import NextResponse from 'next/dist/server/web/exports/next-response'`.
 * Therefore, we must mock the transformed path, not 'next/server'.
 */

// ─────────────────────────────────────────────
// NextResponse mock – targets the resolved path used by next/jest
// ─────────────────────────────────────────────
jest.mock('next/dist/server/web/exports/next-response', () => {
  const MockNextResponse = {
    json: (body: unknown, init?: { status?: number }) => {
      const status = init?.status ?? 200;
      return {
        status,
        json: async () => body,
        headers: new Map(),
      };
    },
    redirect: jest.fn(),
    rewrite: jest.fn(),
    next: jest.fn(),
  };
  return { __esModule: true, default: MockNextResponse };
});

// Mock apiResponse (imported by route for logApiError)
jest.mock('@/lib/apiResponse', () => ({
  logApiError: jest.fn(),
  successResponse: jest.fn(),
  errorResponse: jest.fn(),
}));

// ─────────────────────────────────────────────
// Prisma mock setup (must be before route import)
// ─────────────────────────────────────────────
const mockFindMany = jest.fn();
const mockFindFirst = jest.fn();
const mockQueryRaw = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    song: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
    genre: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

// Mock google-drive utils (imported by route but not needed for GET tests)
jest.mock('@/utils/google-drive', () => ({
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  getImageUrl: jest.fn(),
  getAudioUrl: jest.fn(),
}));

// Mock audioUtils (imported by route but not needed for GET tests)
jest.mock('@/lib/audioUtils', () => ({
  getAudioDuration: jest.fn(),
}));

import { GET } from '@/app/api/songs/route';

// ─────────────────────────────────────────────
// Helper to build a mock song row from the DB
// ─────────────────────────────────────────────
function createDbSong(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: 'Test Song',
    fileName: '1-1',
    artist: 'Artist',
    driveFileId: 'drive-id',
    fileUrl: 'https://drive.google.com/uc?export=view&id=drive-id',
    duration: '180',
    imageId: null,
    imageUrl: null,
    lyrics: null,
    chapterId: 1,
    genreId: 'ccm',
    isNew: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    chapter: { id: 1, name: '1장', order: 1, createdAt: new Date(), updatedAt: new Date() },
    genre: { id: 'ccm', name: 'CCM' },
    popularSong: null,
    ...overrides,
  };
}

// Minimal mock Request object (the GET handler does not inspect the request)
function createMockRequest(): Request {
  return {} as Request;
}

describe('GET /api/songs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an array of songs with status 200', async () => {
    const dbSongs = [
      createDbSong({ id: 1, title: 'Song A' }),
      createDbSong({ id: 2, title: 'Song B' }),
    ];

    mockFindMany.mockResolvedValue(dbSongs);
    mockFindFirst.mockResolvedValue({ id: 'ccm', name: 'CCM', createdAt: new Date(), updatedAt: new Date() });

    // Each song triggers a $queryRaw call for revelation flags
    mockQueryRaw.mockResolvedValue([
      { isRevelationChapter: false, isRevelationKeyVerse: false, isRevelationTitle: false },
    ]);

    const response = await GET(createMockRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.songs).toBeDefined();
    expect(Array.isArray(data.songs)).toBe(true);
    expect(data.songs).toHaveLength(2);
    expect(data.songs[0].title).toBe('Song A');
    expect(data.songs[1].title).toBe('Song B');
  });

  it('should include revelation flags in the response', async () => {
    const dbSongs = [createDbSong({ id: 1 })];

    mockFindMany.mockResolvedValue(dbSongs);
    mockFindFirst.mockResolvedValue({ id: 'ccm', name: 'CCM', createdAt: new Date(), updatedAt: new Date() });
    mockQueryRaw.mockResolvedValue([
      { isRevelationChapter: true, isRevelationKeyVerse: false, isRevelationTitle: true },
    ]);

    const response = await GET(createMockRequest());
    const data = await response.json();

    expect(data.songs[0].isRevelationChapter).toBe(true);
    expect(data.songs[0].isRevelationKeyVerse).toBe(false);
    expect(data.songs[0].isRevelationTitle).toBe(true);
  });

  it('should assign default genre when song has no genre', async () => {
    const songWithoutGenre = createDbSong({ id: 1, genre: null });
    mockFindMany.mockResolvedValue([songWithoutGenre]);

    const defaultGenre = { id: 'ccm', name: 'CCM', createdAt: new Date(), updatedAt: new Date() };
    mockFindFirst.mockResolvedValue(defaultGenre);

    mockQueryRaw.mockResolvedValue([
      { isRevelationChapter: false, isRevelationKeyVerse: false, isRevelationTitle: false },
    ]);

    const response = await GET(createMockRequest());
    const data = await response.json();

    expect(data.songs[0].genre).toBeDefined();
    expect(data.songs[0].genre.id).toBe('ccm');
  });

  it('should return an empty songs array when DB has no songs', async () => {
    mockFindMany.mockResolvedValue([]);
    mockFindFirst.mockResolvedValue({ id: 'ccm', name: 'CCM', createdAt: new Date(), updatedAt: new Date() });

    const response = await GET(createMockRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.songs).toEqual([]);
  });

  it('should call prisma.song.findMany with correct include and orderBy', async () => {
    mockFindMany.mockResolvedValue([]);
    mockFindFirst.mockResolvedValue({ id: 'ccm', name: 'CCM', createdAt: new Date(), updatedAt: new Date() });

    await GET(createMockRequest());

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(mockFindMany).toHaveBeenCalledWith({
      include: {
        chapter: true,
        genre: true,
        popularSong: true,
      },
      orderBy: {
        chapter: {
          name: 'asc',
        },
      },
    });
  });

  // ─────────────────────────────────────────────
  // Error handling
  // ─────────────────────────────────────────────
  describe('error handling', () => {
    it('should return 500 when prisma.song.findMany throws', async () => {
      mockFindMany.mockRejectedValue(new Error('Database connection failed'));

      const response = await GET(createMockRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch songs');
    });

    it('should return 500 when $queryRaw throws', async () => {
      const dbSongs = [createDbSong({ id: 1 })];
      mockFindMany.mockResolvedValue(dbSongs);
      mockFindFirst.mockResolvedValue({ id: 'ccm', name: 'CCM', createdAt: new Date(), updatedAt: new Date() });
      mockQueryRaw.mockRejectedValue(new Error('Raw query failed'));

      const response = await GET(createMockRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch songs');
    });

    it('should return 500 when genre lookup fails', async () => {
      mockFindMany.mockRejectedValue(new Error('Genre table unavailable'));

      const response = await GET(createMockRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch songs');
    });
  });
});
