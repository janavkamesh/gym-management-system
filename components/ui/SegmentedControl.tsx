import React from 'react';

interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div className="flex bg-slate-100 p-1 rounded-lg w-full max-w-sm mx-auto">
      {options.map((option) => {
        const isActive = value === option;
        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-all duration-150 ${
              isActive 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
