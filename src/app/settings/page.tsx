'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const [musicPath, setMusicPath] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 설정 불러오기
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/settings');
        const settings = await response.json();
        setMusicPath(settings.musicPath || '');
      } catch (error) {
        console.error('설정을 불러오는데 실패했습니다:', error);
        toast.error('설정을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  // 설정 저장
  const saveSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ musicPath }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '설정 저장에 실패했습니다.');
      }

      toast.success('설정이 저장되었습니다.');
    } catch (error: any) {
      console.error('설정 저장 실패:', error);
      toast.error(error?.message || '설정 저장에 실패했습니다.');
    }
  };

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">설정</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            음원 파일 경로
          </label>
          <input
            type="text"
            value={musicPath}
            onChange={(e) => setMusicPath(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="예: C:\Music"
          />
          <p className="mt-2 text-sm text-gray-500">
            음원 파일이 저장된 폴더의 전체 경로를 입력하세요.
          </p>
        </div>

        <button
          onClick={saveSettings}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          설정 저장
        </button>
      </div>
    </div>
  );
}
