import { useRef, useCallback } from 'react';

/**
 * PC 마우스 드래그로 가로 스크롤을 가능하게 하는 훅
 * - 3px 이상 드래그하면 클릭 이벤트를 무시하여 드래그/클릭 구분
 * - 관성(momentum) 스크롤: 놓았을 때 속도에 따라 자연스럽게 미끄러짐
 */
export function useDragScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
    hasMoved: false,
    // 관성 스크롤을 위한 속도 추적
    lastX: 0,
    lastTime: 0,
    velocity: 0,
  });
  const momentumRef = useRef<number>(0);

  // 관성 스크롤 애니메이션
  const startMomentum = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    let velocity = dragState.current.velocity;
    const friction = 0.95; // 마찰 계수 (1에 가까울수록 오래 미끄러짐)
    const minVelocity = 0.5; // 이 속도 이하면 멈춤

    const animate = () => {
      velocity *= friction;
      if (Math.abs(velocity) < minVelocity) {
        momentumRef.current = 0;
        return;
      }
      el.scrollLeft -= velocity;
      momentumRef.current = requestAnimationFrame(animate);
    };

    // 기존 애니메이션 취소
    if (momentumRef.current) {
      cancelAnimationFrame(momentumRef.current);
    }
    momentumRef.current = requestAnimationFrame(animate);
  }, []);

  const stopMomentum = useCallback(() => {
    if (momentumRef.current) {
      cancelAnimationFrame(momentumRef.current);
      momentumRef.current = 0;
    }
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    // 진행 중인 관성 스크롤 멈춤
    stopMomentum();

    const now = Date.now();
    dragState.current = {
      isDragging: true,
      startX: e.pageX,
      scrollLeft: el.scrollLeft,
      hasMoved: false,
      lastX: e.pageX,
      lastTime: now,
      velocity: 0,
    };
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  }, [stopMomentum]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.current.isDragging) return;
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();

    const now = Date.now();
    const dx = e.pageX - dragState.current.startX;
    if (Math.abs(dx) > 3) dragState.current.hasMoved = true;
    el.scrollLeft = dragState.current.scrollLeft - dx;

    // 속도 계산 (최근 이동 기반)
    const dt = now - dragState.current.lastTime;
    if (dt > 0) {
      dragState.current.velocity = (e.pageX - dragState.current.lastX) / dt * 15;
    }
    dragState.current.lastX = e.pageX;
    dragState.current.lastTime = now;
  }, []);

  const onMouseUp = useCallback(() => {
    dragState.current.isDragging = false;
    const el = scrollRef.current;
    if (el) {
      el.style.cursor = 'grab';
      el.style.userSelect = '';
    }
    // 충분한 속도가 있으면 관성 스크롤 시작
    if (Math.abs(dragState.current.velocity) > 1) {
      startMomentum();
    }
  }, [startMomentum]);

  const onMouseLeave = useCallback(() => {
    if (dragState.current.isDragging) {
      dragState.current.isDragging = false;
      const el = scrollRef.current;
      if (el) {
        el.style.cursor = 'grab';
        el.style.userSelect = '';
      }
      if (Math.abs(dragState.current.velocity) > 1) {
        startMomentum();
      }
    }
  }, [startMomentum]);

  /** 클릭 핸들러 래퍼: 드래그 후 클릭 무시 */
  const handleClickGuard = useCallback(() => {
    return dragState.current.hasMoved;
  }, []);

  // 드래그 후 자식 요소 클릭 자동 차단 (캡처 단계에서 막음)
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (dragState.current.hasMoved) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  const dragProps = {
    ref: scrollRef,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onClickCapture,
    style: { cursor: 'grab' as const },
  };

  return { scrollRef, dragProps, handleClickGuard };
}
