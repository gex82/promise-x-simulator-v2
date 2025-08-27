import React from 'react';

// TooltipProvider is a no‑op wrapper for the simulator.  The full
// implementation of tooltips is beyond the scope of this lightweight demo.
// We simply return children unchanged.  If you wish to add tooltips, you
// could integrate a library like @radix-ui/react-tooltip here.

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
