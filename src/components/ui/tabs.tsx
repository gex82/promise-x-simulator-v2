import React, { createContext, useContext } from 'react';

// A simple Tabs implementation inspired by radix‑ui tabs but without any
// external dependency.  The Tabs component provides state via context and
// renders children.  TabsList arranges triggers, TabsTrigger toggles the
// active tab, and TabsContent renders its children when active.

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: React.ReactNode }) {
  return <TabsContext.Provider value={{ value, setValue: onValueChange }}>{children}</TabsContext.Provider>;
}

export function TabsList({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function TabsTrigger({ value, children, className = '' }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    return <button className={className}>{children}</button>;
  }
  const active = ctx.value === value;
  const stateClass = active ? 'data-[state=active]' : '';
  return (
    <button
      onClick={() => ctx.setValue(value)}
      className={`${className} ${stateClass}`}
      data-state={active ? 'active' : 'inactive'}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    return <>{children}</>;
  }
  return ctx.value === value ? <div>{children}</div> : null;
}