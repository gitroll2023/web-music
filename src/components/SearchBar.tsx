interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showOnlyNew: boolean;
  onShowOnlyNewChange: (value: boolean) => void;
  showOnlyWithLyrics: boolean;
  onShowOnlyWithLyricsChange: (value: boolean) => void;
  isDarkMode: boolean;
}

export default function SearchBar({
  searchTerm,
  onSearchChange,
  showOnlyNew,
  onShowOnlyNewChange,
  showOnlyWithLyrics,
  onShowOnlyWithLyricsChange,
  isDarkMode
}: SearchBarProps) {
  return (
    <div className={`
      p-4 border-b
      ${isDarkMode 
        ? 'bg-[#191919] border-white/10' 
        : 'bg-white border-gray-200'}
    `}>
      <div className={`
        flex items-center gap-3 p-3 rounded-xl mb-3
        ${isDarkMode 
          ? 'bg-surface hover:bg-surface-light' 
          : 'bg-gray-50 hover:bg-gray-100'}
        transition-colors duration-200
      `}>
        <svg 
          className={`w-5 h-5 flex-shrink-0 ${
            isDarkMode ? 'text-white/60' : 'text-gray-400'
          }`}
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="곡 검색..."
          className={`
            w-full bg-transparent outline-none text-base
            ${isDarkMode 
              ? 'placeholder-white/40 text-white' 
              : 'placeholder-gray-400 text-gray-900'}
          `}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onShowOnlyNewChange(!showOnlyNew)}
          className={`
            flex-1 py-2 rounded-lg text-sm font-medium transition-colors
            ${showOnlyNew 
              ? isDarkMode 
                ? 'bg-primary text-white' 
                : 'bg-blue-500 text-white'
              : isDarkMode
                ? 'bg-surface text-white/60 hover:bg-surface-light' 
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }
          `}
        >
          신곡만 보기
        </button>
        
        <button
          onClick={() => onShowOnlyWithLyricsChange(!showOnlyWithLyrics)}
          className={`
            flex-1 py-2 rounded-lg text-sm font-medium transition-colors
            ${showOnlyWithLyrics 
              ? isDarkMode 
                ? 'bg-primary text-white' 
                : 'bg-blue-500 text-white'
              : isDarkMode
                ? 'bg-surface text-white/60 hover:bg-surface-light' 
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }
          `}
        >
          가사 있는 곡만
        </button>
      </div>
    </div>
  );
} 