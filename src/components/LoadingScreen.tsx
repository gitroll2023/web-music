'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  isDarkMode: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isDarkMode }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed inset-0 flex flex-col items-center justify-center z-[9999] ${
          isDarkMode ? 'bg-background' : 'bg-gray-50'
        }`}
        style={{
          background: isDarkMode 
            ? 'radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)' 
            : 'radial-gradient(circle at center, #f0f0f0 0%, #ffffff 100%)'
        }}
      >
        {/* 회전하는 그라데이션 배경 */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'conic-gradient(from 0deg, rgba(0,0,0,0) 0%, rgba(128,128,128,0.2) 50%, rgba(0,0,0,0) 100%)',
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* 로고 애니메이션 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative mb-8"
        >
          {/* 배경 원 */}
          <motion.div
            className={`absolute inset-0 rounded-full ${
              isDarkMode ? 'bg-surface/40' : 'bg-white/80'
            }`}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ 
              duration: 0.6,
              times: [0, 0.6, 1],
              ease: "easeOut"
            }}
          />
          
          {/* 음표 아이콘 */}
          <svg
            className={`relative w-24 h-24 ${isDarkMode ? 'text-primary' : 'text-primary'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <motion.path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ 
                pathLength: { duration: 1.5, ease: "easeInOut" },
                opacity: { duration: 0.2 }
              }}
            />
          </svg>
        </motion.div>

        {/* 타이틀과 서브타이틀 */}
        <div className="text-center space-y-2 relative z-10">
          <motion.h1
            className={`text-3xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            AI MUSIC
          </motion.h1>

          <motion.p
            className={`text-lg ${
              isDarkMode ? 'text-white/80' : 'text-gray-700'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            계시록을 노래로 쉽게 외우자!
          </motion.p>
        </div>

        {/* 로딩 인디케이터 */}
        <div className="flex space-x-2 mt-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`w-2 h-2 rounded-full ${
                isDarkMode ? 'bg-primary' : 'bg-primary'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1, 0] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* 버전 정보 */}
        <motion.div
          className={`absolute bottom-8 text-center ${
            isDarkMode ? 'text-white/60' : 'text-gray-500'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-sm">Version: 1.4.0</p>
          <p className="text-sm">Update 2025.02.20</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoadingScreen;