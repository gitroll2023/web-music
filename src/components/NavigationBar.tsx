'use client';

import { usePathname, useRouter } from 'next/navigation';

export default function NavigationBar() {
  const pathname = usePathname();
  const router = useRouter();
  
  // 현재 경로에 따라 활성 탭 결정
  const getActiveTab = () => {
    if (pathname === '/') return 'home';
    if (pathname === '/search') return 'explore';
    if (pathname === '/playlist' || pathname === '/settings') return 'library';
    return 'home'; // 기본값
  };
  
  const activeTab = getActiveTab();

  // 탭 변경 핸들러
  const handleTabChange = (tab: 'home' | 'explore' | 'library') => {
    switch(tab) {
      case 'home':
        router.push('/');
        break;
      case 'explore':
        router.push('/search');
        break;
      case 'library':
        router.push('/playlist');
        break;
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-white/[0.06] z-40 h-[52px]" aria-label="메인 내비게이션">
      <div className="max-w-md mx-auto flex justify-around pt-1.5 pb-1.5 px-2 h-full" role="tablist">
        {/* 홈 버튼 */}
        <button
          className={`flex flex-col items-center justify-center gap-0.5 w-1/3 min-h-[44px] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none rounded-lg ${activeTab === 'home' ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
          onClick={() => handleTabChange('home')}
          role="tab"
          aria-selected={activeTab === 'home'}
          aria-current={activeTab === 'home' ? 'page' : undefined}
          aria-label="홈"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" aria-hidden="true">
            <path d="M12 3L4 9V21H9V14H15V21H20V9L12 3Z" fill={activeTab === 'home' ? 'white' : 'rgba(255, 255, 255, 0.4)'} />
          </svg>
          <span className="text-[10px] font-medium">홈</span>
          {activeTab === 'home' && <span className="w-1 h-1 rounded-full bg-white mt-0.5"></span>}
        </button>

        {/* 둘러보기 버튼 */}
        <button
          className={`flex flex-col items-center justify-center gap-0.5 w-1/3 min-h-[44px] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none rounded-lg ${activeTab === 'explore' ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
          onClick={() => handleTabChange('explore')}
          role="tab"
          aria-selected={activeTab === 'explore'}
          aria-current={activeTab === 'explore' ? 'page' : undefined}
          aria-label="검색"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" aria-hidden="true">
            <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill={activeTab === 'explore' ? 'white' : 'rgba(255, 255, 255, 0.4)'} />
          </svg>
          <span className="text-[10px] font-medium">검색</span>
          {activeTab === 'explore' && <span className="w-1 h-1 rounded-full bg-white mt-0.5"></span>}
        </button>

        {/* 보관함 버튼 */}
        <button
          className={`flex flex-col items-center justify-center gap-0.5 w-1/3 min-h-[44px] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none rounded-lg ${activeTab === 'library' ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
          onClick={() => handleTabChange('library')}
          role="tab"
          aria-selected={activeTab === 'library'}
          aria-current={activeTab === 'library' ? 'page' : undefined}
          aria-label="보관함"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" aria-hidden="true">
            <path d="M20 2H8C6.9 2 6 2.9 6 4V16C6 17.1 6.9 18 8 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H8V4H20V16ZM4 6H2V20C2 21.1 2.9 22 4 22H18V20H4V6ZM16 12V8H13V12H16ZM15 9L13 11V9H15Z" fill={activeTab === 'library' ? 'white' : 'rgba(255, 255, 255, 0.4)'} />
          </svg>
          <span className="text-[10px] font-medium">보관함</span>
          {activeTab === 'library' && <span className="w-1 h-1 rounded-full bg-white mt-0.5"></span>}
        </button>
      </div>
    </nav>
  );
} 