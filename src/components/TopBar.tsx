import { useState, useRef, useEffect } from 'react';
import { BiSearch, BiDotsVerticalRounded } from 'react-icons/bi';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { IoMdInformationCircleOutline } from 'react-icons/io';
import { MdOutlineMusicNote } from 'react-icons/md';

interface TopBarProps {
  isLoading?: boolean;
}

export default function TopBar({ isLoading = false }: TopBarProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isSearchHovered, setIsSearchHovered] = useState(false);
  const [isSearchClicked, setIsSearchClicked] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const [searchButtonPosition, setSearchButtonPosition] = useState({ top: 0, right: 0 });
  
  // 윈도우 크기 감지
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
    
    // 초기 설정
    if (typeof window !== 'undefined') {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
      window.addEventListener('resize', handleResize);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);
  
  // 검색 버튼 위치 계산
  useEffect(() => {
    if (searchButtonRef.current) {
      const rect = searchButtonRef.current.getBoundingClientRect();
      setSearchButtonPosition({
        top: rect.top,
        right: window.innerWidth - rect.right
      });
    }
  }, [windowSize]);

  const handleSearchClick = () => {
    // 클릭 시 버튼 위치 다시 계산
    if (searchButtonRef.current) {
      const rect = searchButtonRef.current.getBoundingClientRect();
      setSearchButtonPosition({
        top: rect.top,
        right: window.innerWidth - rect.right
      });
    }
    
    setIsSearchClicked(true);
    // 애니메이션 완료 후 페이지 이동
    setTimeout(() => {
      router.push('/search');
    }, 800);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleVersionInfo = () => {
    setIsMenuOpen(false);
    setShowVersionModal(true);
  };

  const handleSongRequest = () => {
    setIsMenuOpen(false);
    setShowRequestModal(true);
  };

  return (
    <div className="relative flex justify-between items-center pt-1 pb-2">
      <div className="flex items-center gap-2">
        <motion.div 
          className="h-10 flex items-center justify-center font-bold text-2xl tracking-tight select-none cursor-pointer"
          initial={{ opacity: 0, y: -10 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            textShadow: [
              "0 0 5px rgba(255,255,255,0)",
              "0 0 15px rgba(255,255,255,0.5)",
              "0 0 5px rgba(255,255,255,0)"
            ]
          }}
          transition={{
            duration: 0.8,
            ease: "easeOut"
          }}
          whileHover={{
            scale: 1.05,
            transition: { duration: 0.3 }
          }}
          onHoverStart={() => setIsLogoHovered(true)}
          onHoverEnd={() => setIsLogoHovered(false)}
          onTouchStart={() => setIsLogoHovered(true)}
          onTouchEnd={() => setTimeout(() => setIsLogoHovered(false), 1500)}
        >
          {!isLogoHovered ? (
            <>
              <motion.span
                className="text-red-600"
                animate={{
                  color: ["#dc2626", "#ef4444", "#dc2626"],
                  textShadow: [
                    "0 0 5px rgba(220,38,38,0.3)",
                    "0 0 10px rgba(220,38,38,0.6)",
                    "0 0 5px rgba(220,38,38,0.3)"
                  ]
                }}
                transition={{
                  duration: 3,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                NAJU
              </motion.span>
              <motion.span
                className="text-white ml-1"
                animate={{
                  opacity: [0.8, 1, 0.8],
                  textShadow: [
                    "0 0 5px rgba(255,255,255,0.1)",
                    "0 0 10px rgba(255,255,255,0.3)",
                    "0 0 5px rgba(255,255,255,0.1)"
                  ]
                }}
                transition={{
                  duration: 3,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: 0.5
                }}
              >
                INFO
              </motion.span>
            </>
          ) : (
            <>
              <motion.span
                className="text-red-600"
                animate={{
                  color: ["#dc2626", "#ef4444", "#dc2626"],
                  textShadow: [
                    "0 0 5px rgba(220,38,38,0.3)",
                    "0 0 10px rgba(220,38,38,0.6)",
                    "0 0 5px rgba(220,38,38,0.3)"
                  ]
                }}
                transition={{
                  duration: 3,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                NAJU
              </motion.span>
              <motion.span
                className="text-white ml-1"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  textShadow: [
                    "0 0 5px rgba(255,255,255,0.1)",
                    "0 0 10px rgba(255,255,255,0.3)",
                    "0 0 5px rgba(255,255,255,0.1)"
                  ]
                }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut"
                }}
              >
                INFO
              </motion.span>
            </>
          )}
        </motion.div>
      </div>
      {!isLoading && (
        <div className="flex items-center gap-4">
          <div className="relative w-8 h-8">
            {!isSearchClicked && (
              <motion.button 
                ref={searchButtonRef}
                className="w-8 h-8 flex items-center justify-center text-white absolute top-0 left-0 overflow-visible"
                onClick={handleSearchClick}
                onMouseEnter={() => setIsSearchHovered(true)}
                onMouseLeave={() => setIsSearchHovered(false)}
                whileHover={{ 
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  transition: { duration: 0.2 } 
                }}
                exit={{ opacity: 0 }}
                style={{ 
                  borderRadius: "50%",
                  zIndex: 1 
                }}
              >
                <motion.div
                  animate={
                    isSearchHovered 
                      ? { 
                          scale: 1.2,
                          rotate: [0, 15, 0, -15, 0],
                          color: ["#ffffff", "#e0e0e0", "#ffffff"]
                        } 
                      : { scale: 1 }
                  }
                  transition={{ 
                    scale: { duration: 0.2 },
                    rotate: { duration: 0.5, repeat: 0 },
                    color: { duration: 0.5, repeat: Infinity, repeatType: "reverse" }
                  }}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center"
                  }}
                >
                  <BiSearch size={24} />
                </motion.div>
              </motion.button>
            )}
            
            {isSearchClicked && (
              <>
                <motion.div
                  className="fixed inset-0 bg-gradient-to-br from-blue-900/80 to-black/90 z-[999]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
                
                <motion.div
                  className="fixed z-[1000]"
                  initial={{ 
                    top: searchButtonPosition.top, 
                    right: searchButtonPosition.right,
                    scale: 1,
                    opacity: 1
                  }}
                  animate={{ 
                    top: windowSize.height / 2 - 12,
                    right: windowSize.width / 2 - 12,
                    scale: [1, 1.5, 30],
                    opacity: [1, 1, 0.9, 0]
                  }}
                  transition={{
                    top: { duration: 0.3, ease: "easeInOut" },
                    right: { duration: 0.3, ease: "easeInOut" },
                    scale: { duration: 0.8, ease: "easeInOut", times: [0, 0.4, 1] },
                    opacity: { duration: 0.8, ease: "easeInOut", times: [0, 0.5, 0.7, 1] }
                  }}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center"
                  }}
                >
                  <BiSearch size={24} color="#ffffff" />
                </motion.div>
              </>
            )}
          </div>
          <button
            className="w-10 h-10 flex items-center justify-center text-white rounded-full hover:bg-white/10 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
            onClick={toggleMenu}
          >
            <BiDotsVerticalRounded size={24} />
          </button>
        </div>
      )}
      {/* 드롭다운 메뉴 */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="absolute top-10 right-2 z-50 bg-gray-800/95 backdrop-blur-md rounded-xl shadow-2xl w-48 py-1 border border-white/10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <button
              className="w-full px-4 py-3 flex items-center gap-3 text-left text-white hover:bg-white/10 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
              onClick={handleVersionInfo}
            >
              <IoMdInformationCircleOutline size={20} />
              <span>버전 정보</span>
            </button>
            <button
              className="w-full px-4 py-3 flex items-center gap-3 text-left text-white hover:bg-white/10 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
              onClick={handleSongRequest}
            >
              <MdOutlineMusicNote size={20} />
              <span>노래 요청</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 버전 정보 모달 */}
      <AnimatePresence>
        {showVersionModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowVersionModal(false)}
          >
            <motion.div
              className="bg-gray-900/95 backdrop-blur-xl p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-white/10"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">버전 정보</h3>
              <div className="space-y-3 mb-6">
                <p className="text-gray-300">
                  <span className="font-semibold">버전: </span>
                  <span className="text-white">1.5.1</span>
                </p>
                <p className="text-gray-300">
                  <span className="font-semibold">수정일: </span>
                  <span className="text-white">2025.05.03</span>
                </p>
              </div>
              <button
                className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none active:scale-[0.98]"
                onClick={() => setShowVersionModal(false)}
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 노래 요청 모달 */}
      <AnimatePresence>
        {showRequestModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRequestModal(false)}
          >
            <motion.div
              className="bg-gray-900/95 backdrop-blur-xl p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-white/10"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">노래 요청</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                원하는 노래의 유형을 신청할 수 있는 기능입니다.<br />
                현재 개발 중이며 다음 업데이트에서 만나보실 수 있습니다.<br /><br />
                더 좋은 서비스로 찾아뵙겠습니다.
              </p>
              <button
                className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none active:scale-[0.98]"
                onClick={() => setShowRequestModal(false)}
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 