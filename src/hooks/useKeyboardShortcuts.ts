'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsOptions {
  onTogglePlay: () => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  isEnabled?: boolean;
}

/**
 * 키보드 단축키 훅
 * - Space: 재생/일시정지 토글
 * - ArrowLeft: 5초 뒤로 탐색
 * - ArrowRight: 5초 앞으로 탐색
 * - ArrowUp: 볼륨 올리기
 * - ArrowDown: 볼륨 내리기
 */
export function useKeyboardShortcuts({
  onTogglePlay,
  onSeekBackward,
  onSeekForward,
  onVolumeUp,
  onVolumeDown,
  isEnabled = true,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isEnabled) return;

      // 입력 필드에 포커스가 있으면 단축키 무시
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          onTogglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onSeekBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onSeekForward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          onVolumeUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          onVolumeDown();
          break;
        default:
          break;
      }
    },
    [isEnabled, onTogglePlay, onSeekBackward, onSeekForward, onVolumeUp, onVolumeDown]
  );

  useEffect(() => {
    if (!isEnabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, isEnabled]);
}
