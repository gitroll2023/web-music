/**
 * Share a song using the Web Share API with clipboard fallback.
 * Returns true if sharing succeeded, false otherwise.
 */
export async function shareSong(title: string, songId: number): Promise<boolean> {
  const url = `${window.location.origin}/song/${songId}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `계시록 찬양 - ${title}`,
        text: `${title} 을(를) 들어보세요!`,
        url,
      });
      return true;
    } catch (error) {
      // User cancelled or share failed - fall through to clipboard
      if ((error as DOMException)?.name === 'AbortError') {
        // User cancelled the share dialog
        return false;
      }
    }
  }

  // Fallback: copy URL to clipboard
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    // Clipboard API may not be available in insecure contexts
    return false;
  }
}
