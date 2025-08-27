import React from 'react';

// A lightweight select implementation.  The `Select` component wraps a native
// `<select>` element.  The `onValueChange` prop receives the selected
// value as a string.  To define options, use `SelectItem` inside the
// `Select`.

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

export function Select({ value, onValueChange, className = '', children, ...props }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={`appearance-none px-2 py-2 rounded ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function SelectItem({ value, children, className = '' }: SelectItemProps) {
  return (
    <option value={value} className={className}>
      {children}
    </option>
  );
}