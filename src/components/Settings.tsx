'use client';

interface SettingsProps {
  isDarkMode: boolean;
  onThemeChangeAction: (isDark: boolean) => void;
  defaultVolume: number;
  onVolumeChangeAction: (volume: number) => void;
}

export default function Settings({ 
  isDarkMode, 
  onThemeChangeAction,
  defaultVolume,
  onVolumeChangeAction,
}: SettingsProps) {
  const handleClearPlaylist = () => {
    if (window.confirm('재생목록을 초기화하시겠습니까?')) {
      localStorage.removeItem('playlist');
      window.location.reload();
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('모든 설정을 초기화하시겠습니까?')) {
      localStorage.removeItem('settings');
      window.location.reload();
    }
  };

  return (
    <div className="p-4 space-y-8 pb-40">
      {/* 화면 설정 */}
      <section>
        <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          화면 설정
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>다크 모드</span>
              <p className="text-sm text-text-secondary">어두운 테마로 변경합니다</p>
            </div>
            <button
              onClick={() => onThemeChangeAction(!isDarkMode)}
              className={`p-2 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'}`}
            >
              {isDarkMode ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 재생 설정 */}
      <section>
        <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          재생 설정
        </h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>기본 음량</span>
              <span className="text-text-secondary">{Math.round(defaultVolume * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={Math.round(defaultVolume * 100)}
              onChange={(e) => onVolumeChangeAction(Number(e.target.value) / 100)}
              className="w-full accent-indigo-500 cursor-pointer"
              style={{
                height: '8px',
                borderRadius: '4px',
                background: isDarkMode ? '#374151' : '#E5E7EB',
              }}
            />
          </div>
        </div>
      </section>

      {/* 데이터 관리 */}
      <section>
        <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          데이터 관리
        </h2>
        <div className="space-y-4">
          <button 
            onClick={handleClearPlaylist}
            className="w-full py-2 px-4 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20"
          >
            재생목록 초기화
          </button>
          <button 
            onClick={handleResetSettings}
            className="w-full py-2 px-4 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20"
          >
            설정 초기화
          </button>
        </div>
      </section>

      {/* 앱 정보 */}
      <section>
        <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          앱 정보
        </h2>
        <div className="space-y-2 text-sm text-text-secondary">
          <p>AI 계시록 뮤직 웹 플레이어</p>
          <p>버전: 1.4.0</p>
          
        </div>
      </section>
    </div>
  );
} 