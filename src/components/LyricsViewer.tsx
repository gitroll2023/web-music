import { useState, useEffect } from 'react';

interface LyricsViewerProps {
  url: string;
}

const LyricsViewer: React.FC<LyricsViewerProps> = ({ url }) => {
  const [lyrics, setLyrics] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLyrics = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load lyrics');
        const text = await response.text();
        setLyrics(text);
      } catch (err) {
        setError('가사를 불러오는데 실패했습니다.');
        console.error('Error loading lyrics:', err);
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchLyrics();
    }
  }, [url]);

  if (loading) {
    return <div className="text-center py-4">가사를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">{error}</div>;
  }

  return (
    <pre className="whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200">
      {lyrics}
    </pre>
  );
};

export default LyricsViewer;
