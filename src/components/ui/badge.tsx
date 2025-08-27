import React from 'react';

// A tiny badge component.  A badge is a rounded pill used to highlight
// contextual information.  The appearance is controlled by classes supplied by
// the caller via `className` and, optionally, a `variant` prop.  Variants
// available: 'secondary' or default.

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'secondary' | 'default' | 'destructive';
}

export function Badge({ children, className = '', variant = 'default' }: BadgeProps) {
  let base = '';
  switch (variant) {
    case 'secondary':
      base = 'bg-white/10 text-white';
      break;
    case 'destructive':
      base = 'bg-rose-600/40 border border-rose-600/60 text-rose-50';
      break;
    default:
      base = '';
      break;
  }
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${base} ${className}`}>
      {children}
    </span>
  );
}