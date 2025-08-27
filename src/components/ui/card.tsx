import React from 'react';

// A very light Card implementation.  Cards are just containers with rounded
// corners and an optional border.  Compose them with CardHeader, CardTitle,
// CardContent and CardFooter for structure.  All styling comes from Tailwind
// classes supplied by the caller via `className`.

export function Card({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <h2 className={`font-semibold ${className}`}>{children}</h2>;
}

export function CardContent({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <div className={`p-4 pt-2 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <div className={`p-4 border-t ${className}`}>{children}</div>;
}