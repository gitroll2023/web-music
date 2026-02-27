import { render, screen, fireEvent } from '@testing-library/react';
import NavigationBar from '@/components/NavigationBar';

// ─────────────────────────────────────────────
// next/navigation 모의 설정
// ─────────────────────────────────────────────
const mockPush = jest.fn();
const mockUsePathname = jest.fn<string, []>();

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('NavigationBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/');
  });

  // ─────────────────────────────────────────────
  // 탭 렌더링
  // ─────────────────────────────────────────────
  describe('탭 렌더링', () => {
    it('세 개의 탭이 렌더링된다 (홈, 검색, 보관함)', () => {
      render(<NavigationBar />);

      expect(screen.getByText('홈')).toBeInTheDocument();
      expect(screen.getByText('검색')).toBeInTheDocument();
      expect(screen.getByText('보관함')).toBeInTheDocument();
    });

    it('탭 목록(tablist) 역할이 있는 컨테이너가 렌더링된다', () => {
      render(<NavigationBar />);

      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('각 탭에 tab 역할이 부여되어 있다', () => {
      render(<NavigationBar />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
    });

    it('내비게이션 랜드마크가 올바른 aria-label을 갖는다', () => {
      render(<NavigationBar />);

      expect(screen.getByRole('navigation', { name: '메인 내비게이션' })).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────
  // 활성 탭 하이라이트
  // ─────────────────────────────────────────────
  describe('활성 탭 하이라이트', () => {
    it('홈 경로(/)에서 홈 탭이 활성화된다', () => {
      mockUsePathname.mockReturnValue('/');
      render(<NavigationBar />);

      const homeTab = screen.getByRole('tab', { name: '홈' });
      expect(homeTab).toHaveAttribute('aria-selected', 'true');
      expect(homeTab).toHaveAttribute('aria-current', 'page');
    });

    it('홈 경로(/)에서 다른 탭은 비활성화 상태이다', () => {
      mockUsePathname.mockReturnValue('/');
      render(<NavigationBar />);

      const searchTab = screen.getByRole('tab', { name: '검색' });
      const libraryTab = screen.getByRole('tab', { name: '보관함' });

      expect(searchTab).toHaveAttribute('aria-selected', 'false');
      expect(libraryTab).toHaveAttribute('aria-selected', 'false');
    });

    it('검색 경로(/search)에서 검색 탭이 활성화된다', () => {
      mockUsePathname.mockReturnValue('/search');
      render(<NavigationBar />);

      const searchTab = screen.getByRole('tab', { name: '검색' });
      expect(searchTab).toHaveAttribute('aria-selected', 'true');
      expect(searchTab).toHaveAttribute('aria-current', 'page');
    });

    it('보관함 경로(/playlist)에서 보관함 탭이 활성화된다', () => {
      mockUsePathname.mockReturnValue('/playlist');
      render(<NavigationBar />);

      const libraryTab = screen.getByRole('tab', { name: '보관함' });
      expect(libraryTab).toHaveAttribute('aria-selected', 'true');
      expect(libraryTab).toHaveAttribute('aria-current', 'page');
    });

    it('설정 경로(/settings)에서 보관함 탭이 활성화된다', () => {
      mockUsePathname.mockReturnValue('/settings');
      render(<NavigationBar />);

      const libraryTab = screen.getByRole('tab', { name: '보관함' });
      expect(libraryTab).toHaveAttribute('aria-selected', 'true');
      expect(libraryTab).toHaveAttribute('aria-current', 'page');
    });

    it('알 수 없는 경로에서 홈 탭이 기본으로 활성화된다', () => {
      mockUsePathname.mockReturnValue('/unknown-page');
      render(<NavigationBar />);

      const homeTab = screen.getByRole('tab', { name: '홈' });
      expect(homeTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  // ─────────────────────────────────────────────
  // 탭 클릭 시 라우팅
  // ─────────────────────────────────────────────
  describe('탭 클릭 시 라우팅', () => {
    it('홈 탭 클릭 시 router.push("/")가 호출된다', () => {
      mockUsePathname.mockReturnValue('/search');
      render(<NavigationBar />);

      const homeTab = screen.getByRole('tab', { name: '홈' });
      fireEvent.click(homeTab);

      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('검색 탭 클릭 시 router.push("/search")가 호출된다', () => {
      mockUsePathname.mockReturnValue('/');
      render(<NavigationBar />);

      const searchTab = screen.getByRole('tab', { name: '검색' });
      fireEvent.click(searchTab);

      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/search');
    });

    it('보관함 탭 클릭 시 router.push("/playlist")가 호출된다', () => {
      mockUsePathname.mockReturnValue('/');
      render(<NavigationBar />);

      const libraryTab = screen.getByRole('tab', { name: '보관함' });
      fireEvent.click(libraryTab);

      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/playlist');
    });

    it('이미 활성화된 탭을 클릭해도 router.push가 호출된다', () => {
      mockUsePathname.mockReturnValue('/');
      render(<NavigationBar />);

      const homeTab = screen.getByRole('tab', { name: '홈' });
      fireEvent.click(homeTab);

      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
});
