import React from 'react';

// A very simple input component.  This wraps a native <input> and applies
// sensible Tailwind classes for a dark UI.  It forwards all props to the
// underlying input element.  Consumers can override the styling via the
// className prop.

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className = '', ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`px-2 py-1 rounded-md bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 ${className}`}
        {...props}
      />
    );
  },
);
