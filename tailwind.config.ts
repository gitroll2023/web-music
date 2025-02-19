import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',    // 블루
        text: '#1F2937',       // 다크그레이
        secondary: '#6B7280',  // 그레이
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        pretendard: ['Pretendard', 'sans-serif'],
      },
      keyframes: {
        soundwave: {
          '0%, 100%': { height: '4px' },
          '50%': { height: '12px' }
        }
      },
      animation: {
        soundwave: 'soundwave 0.5s ease-in-out infinite'
      }
    }
  },
  plugins: [],
} satisfies Config;

export default config;
