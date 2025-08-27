import React from 'react';

// A simple progress bar.  The `value` prop should be between 0 and 100.  The
// bar is rendered as a filled portion of a background track.  Additional
// classes can be applied via the `className` prop.

interface ProgressProps {
  value: number;
  className?: string;
}

export function Progress({ value, className = '' }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`relative w-full h-2 bg-white/20 rounded ${className}`}>
      <div
        className="h-full bg-indigo-600 rounded"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
