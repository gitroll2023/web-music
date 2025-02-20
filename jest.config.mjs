import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // next.config.js와 .env 파일이 있는 경로
  dir: './',
});

// Jest에 전달할 설정
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.mjs'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

export default createJestConfig(customJestConfig);
