import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  QueueListIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export default function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black text-white border-t border-gray-800">
      <div className="flex justify-around items-center py-3">
        <Link
          href="/"
          className={`flex flex-col items-center ${
            pathname === '/' ? 'text-[#1ED760]' : 'text-gray-400'
          }`}
        >
          <HomeIcon className="w-6 h-6" />
        </Link>
        <Link
          href="/playlist"
          className={`flex flex-col items-center ${
            pathname === '/playlist' ? 'text-[#1ED760]' : 'text-gray-400'
          }`}
        >
          <QueueListIcon className="w-6 h-6" />
        </Link>
        <Link
          href="/settings"
          className={`flex flex-col items-center ${
            pathname === '/settings' ? 'text-[#1ED760]' : 'text-gray-400'
          }`}
        >
          <Cog6ToothIcon className="w-6 h-6" />
        </Link>
      </div>
    </nav>
  );
}
