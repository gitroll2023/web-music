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

  return (
    <input
      type="range"
      min={0}
      max={max}
      value={value}
      onChange={handleChange}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
    />
  );
} 