import React from 'react';

// A basic toggle switch.  It consists of a hidden checkbox wrapped by a
// container that animates a knob.  The knob slides to the right when
// `checked` is true.  Call `onCheckedChange` with the new state.

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  'aria-label'?: string;
}

export function Switch({ checked, onCheckedChange, 'aria-label': ariaLabel }: SwitchProps) {
  return (
    <label className="inline-flex items-center cursor-pointer" aria-label={ariaLabel}>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      <span
        className={`w-10 h-4 flex items-center bg-gray-700 rounded-full p-1 transition-colors ${
          checked ? 'bg-indigo-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        ></span>
      </span>
    </label>
  );
}