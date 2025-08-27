import React from 'react';

// A simple range slider.  Accepts an array `value` with one number (for
// consistency with shadcn) and calls `onValueChange` with a new array when
// changed.  Styling leverages Tailwind.  For accessibility, pass
// `aria-label` where needed.

interface SliderProps {
  value: number[];
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number[]) => void;
  'aria-label'?: string;
}

export function Slider({ value, min, max, step = 1, onValueChange, 'aria-label': ariaLabel }: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange([parseFloat(e.target.value)]);
  };
  return (
    <input
      type="range"
      value={value[0]}
      min={min}
      max={max}
      step={step}
      onChange={handleChange}
      aria-label={ariaLabel}
      className="w-full h-1 bg-slate-600 rounded-md appearance-none cursor-pointer"
    />
  );
}