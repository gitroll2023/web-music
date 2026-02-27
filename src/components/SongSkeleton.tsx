export default function SongSkeleton() {
  return (
    <div className="flex items-center space-x-4 animate-pulse">
      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );
}
