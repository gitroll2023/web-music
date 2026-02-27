import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  QueueListIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

export default function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black text-white border-t border-gray-800" aria-label="모바일 내비게이션">
      <div className="flex justify-around items-center py-3" role="tablist">
        <Link
          href="/"
          className={`flex flex-col items-center ${
            pathname === '/' ? 'text-[#1ED760]' : 'text-gray-400'
          }`}
          aria-label="홈"
          aria-current={pathname === '/' ? 'page' : undefined}
          role="tab"
          aria-selected={pathname === '/'}
        >
          <HomeIcon className="w-6 h-6" aria-hidden="true" />
        </Link>
        <Link
          href="/search"
          className={`flex flex-col items-center ${
            pathname === '/search' ? 'text-[#1ED760]' : 'text-gray-400'
          }`}
          aria-label="검색"
          aria-current={pathname === '/search' ? 'page' : undefined}
          role="tab"
          aria-selected={pathname === '/search'}
        >
          <MagnifyingGlassIcon className="w-6 h-6" aria-hidden="true" />
        </Link>
        <Link
          href="/playlist"
          className={`flex flex-col items-center ${
            pathname === '/playlist' ? 'text-[#1ED760]' : 'text-gray-400'
          }`}
          aria-label="재생목록"
          aria-current={pathname === '/playlist' ? 'page' : undefined}
          role="tab"
          aria-selected={pathname === '/playlist'}
        >
          <QueueListIcon className="w-6 h-6" aria-hidden="true" />
        </Link>
        <Link
          href="/settings"
          className={`flex flex-col items-center ${
            pathname === '/settings' ? 'text-[#1ED760]' : 'text-gray-400'
          }`}
          aria-label="설정"
          aria-current={pathname === '/settings' ? 'page' : undefined}
          role="tab"
          aria-selected={pathname === '/settings'}
        >
          <Cog6ToothIcon className="w-6 h-6" aria-hidden="true" />
        </Link>
      </div>
    </nav>
  );
}
