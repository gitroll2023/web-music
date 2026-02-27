'use client';

import { useEffect } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import NavigationBar from '@/components/NavigationBar';

export default function PlaylistPage() {
  return (
    <MainLayout>
      <div className="bg-black text-white min-h-screen pb-36 flex flex-col items-center justify-center">
        <div className="text-center px-4 py-10">
          <h1 className="text-3xl font-bold mb-4">보관함</h1>
          <p className="text-lg text-white/70 mb-6">아직 구현되지 않은 기능입니다.</p>
          <div className="w-16 h-16 mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white/50">
              <path d="M20 2H8C6.9 2 6 2.9 6 4V16C6 17.1 6.9 18 8 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H8V4H20V16ZM4 6H2V20C2 21.1 2.9 22 4 22H18V20H4V6ZM16 12V8H13V12H16ZM15 9L13 11V9H15Z" />
            </svg>
          </div>
          <p className="text-white/50 text-sm">
            이 기능은 곧 업데이트될 예정입니다. <br />
            나중에 다시 확인해주세요.
          </p>
        </div>
      </div>
      <NavigationBar />
    </MainLayout>
  );
} 