import React from 'react';

// A minimal button component.  Supports `variant` props (default, outline,
// destructive) and forwards any additional props to the underlying button.

type Variant = 'default' | 'outline' | 'destructive';

// Extend base button attributes and explicitly allow children.  Without
// specifying `children` here, TypeScript will complain when passing
// children to the component.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children?: React.ReactNode;
}

export function Button({ variant = 'default', className = '', ...props }: ButtonProps) {
  let classes = '';
  switch (variant) {
    case 'outline':
      classes = 'border border-slate-700 bg-white/5 hover:bg-white/10 text-white';
      break;
    case 'destructive':
      classes = 'bg-rose-600 hover:bg-rose-500 text-white';
      break;
    default:
      classes = 'bg-indigo-600 hover:bg-indigo-500 text-white';
      break;
  }
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium focus:outline-none ${classes} ${className}`}
    />
  );
}