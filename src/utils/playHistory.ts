const STORAGE_KEY = 'play-history';
const MAX_ITEMS = 20;

export interface PlayHistoryItem {
  songId: number;
  title: string;
  fileName: string;
  playedAt: string; // ISO timestamp
}

/**
 * Read the full play history from localStorage.
 * Returns an empty array when storage is unavailable or contains invalid data.
 */
export function getHistory(): PlayHistoryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as PlayHistoryItem[];
  } catch {
    return [];
  }
}

/**
 * Add a song to the front of the play history.
 * - If the song already exists it is moved to the front (no duplicates).
 * - The list is capped at MAX_ITEMS entries.
 */
export function addToHistory(song: {
  id: number;
  title: string;
  fileName: string;
}): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getHistory();

    // Remove existing entry for this song (if any)
    const filtered = history.filter((item) => item.songId !== song.id);

    // Prepend the new entry
    const entry: PlayHistoryItem = {
      songId: song.id,
      title: song.title,
      fileName: song.fileName,
      playedAt: new Date().toISOString(),
    };

    const updated = [entry, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Silently ignore storage errors (quota exceeded, etc.)
  }
}

/**
 * Clear the entire play history.
 */
export function clearHistory(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently ignore
  }
}
