'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import crypto from 'crypto';

export default function RefreshTokenPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // 클라이언트 사이드에서 비밀번호 해시 생성 (대소문자 구분 없이)
  const hashPassword = (pwd: string) => {
    return crypto.createHash('sha256').update(pwd.toLowerCase()).digest('hex');
  };

  // 서버에 저장된 해시와 비교 (wjsoft의 해시값, 소문자로 변환)
  const correctHash = '23d5718f5e0f91a2843a4cbce0e62795c3f1d47ae260290131715c672995fe86';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hashedInput = hashPassword(password);
    
    if (hashedInput === correctHash) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('비밀번호가 올바르지 않습니다.');
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const response = await fetch('/api/auth/google');
      const data = await response.json();
      
      if (data.authUrl) {
        window.open(data.authUrl, 'googleAuth', 'width=600,height=800');
      }
    } catch (error) {
      console.error('Error starting Google auth:', error);
      setError('구글 인증을 시작하는데 실패했습니다.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center text-black">인증 필요</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              확인
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-black">Google Drive 인증</h1>
        <button
          onClick={handleGoogleAuth}
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Google Drive 인증하기
        </button>
      </div>
    </div>
  );
}
