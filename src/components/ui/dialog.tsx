import React, { useContext, useState, createContext, ReactNode } from 'react';

// A minimal dialog implementation.  It uses React context to manage the
// open/closed state and renders the children into a simple overlay when
// visible.  This is intentionally barebones but sufficient for the demo.

interface DialogContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export function Dialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>
  );
}

export function DialogTrigger({ asChild = false, children }: { asChild?: boolean; children: ReactNode }) {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('DialogTrigger must be used within a Dialog');
  const { setOpen } = ctx;
  if (!React.isValidElement(children)) return null;
  const onClick = () => setOpen(true);
  // If asChild is true, clone the element and attach onClick.  Otherwise
  // wrap in a span so we can attach the onClick listener.
  return asChild
    ? React.cloneElement(children, { onClick })
    : (
      <span onClick={onClick} className="inline-flex items-center">
        {children}
      </span>
    );
}

export function DialogContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('DialogContent must be used within a Dialog');
  const { open, setOpen } = ctx;
  if (!open) return null;
  // Close the dialog when clicking outside the content
  const close = () => setOpen(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={close} />
      <div
        className={`relative z-10 w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg p-4 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children }: { children: ReactNode }) {
  return <div className="mb-3">{children}</div>;
}

export function DialogTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>;
}

export function DialogDescription({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-sm ${className}`}>{children}</p>;
}
