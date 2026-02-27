'use client';

interface SeekBarProps {
  value: number;
  max: number;
  onChangeAction: (value: number) => void;
}

export default function SeekBar({ value, max, onChangeAction }: SeekBarProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeAction(Number(e.target.value));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <input
      type="range"
      min={0}
      max={max}
      value={value}
      onChange={handleChange}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
      aria-label="재생 위치"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuetext={`${formatTime(value)} / ${formatTime(max)}`}
      role="slider"
    />
  );
} 