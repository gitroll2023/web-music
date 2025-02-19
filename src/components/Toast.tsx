'use client';

interface ToastProps {
  message: string;
  isVisible: boolean;
}

export default function Toast({ message, isVisible }: ToastProps) {
  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 bg-black/90 text-white px-6 py-3 rounded-lg
        shadow-lg transition-all duration-300 z-50 text-sm font-medium ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}
    >
      <div className="flex items-center space-x-2">
        <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
        </svg>
        <span>{message}</span>
      </div>
    </div>
  );
} 