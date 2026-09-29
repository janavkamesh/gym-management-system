"use client";

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  className?: string;
  placeholder?: string;
  renderInline?: boolean;
}

export function Dropdown({ value, onChange, options, className = '', placeholder, renderInline = false }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropDirection, setDropDirection] = useState<'down' | 'up'>('down');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(options.findIndex(opt => opt.value === value));
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;
          if (spaceBelow < 250 && spaceAbove > spaceBelow) {
            setDropDirection('up');
          } else {
            setDropDirection('down');
          }
        }
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          onChange(options[focusedIndex].value);
          setIsOpen(false);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + options.length) % options.length);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div 
      className={`relative ${className}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        onClick={() => {
          if (!isOpen) {
            setFocusedIndex(options.findIndex(opt => opt.value === value));
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const spaceBelow = window.innerHeight - rect.bottom;
              const spaceAbove = rect.top;
              if (spaceBelow < 250 && spaceAbove > spaceBelow) {
                setDropDirection('up');
              } else {
                setDropDirection('down');
              }
            }
          }
          setIsOpen(!isOpen);
        }}
        className="w-full min-h-12 md:min-h-10 px-3 bg-white rounded-lg border border-slate-200 text-sm flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-150 active:scale-95 touch-manipulation"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate text-slate-900 font-medium">
          {selectedOption ? selectedOption.label : (placeholder || 'Select...')}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {renderInline ? (
        <div className={`grid transition-all duration-150 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'}`}>
          <div className="overflow-hidden">
            <ul
              ref={listRef}
              className="w-full bg-white border border-slate-200 rounded-lg shadow-sm max-h-60 overflow-auto focus:outline-none"
              role="listbox"
              tabIndex={-1}
            >
              {options.map((option, index) => {
                const isSelected = option.value === value;
                const isFocused = index === focusedIndex;
                
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    className={`
                      px-3 min-h-12 cursor-pointer flex items-center justify-between transition-colors duration-120
                      ${isFocused ? 'bg-slate-50' : 'hover:bg-slate-50'}
                      ${isSelected ? 'text-blue-600 font-medium' : 'text-slate-700'}
                    `}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setFocusedIndex(index)}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && <Check size={16} className="text-blue-600" />}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : (
        <ul
          ref={listRef}
          className={`absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-md max-h-60 overflow-auto focus:outline-none transform transition-all ${isOpen ? 'duration-150 ease-out opacity-100 translate-y-0' : 'duration-100 ease-in opacity-0 pointer-events-none translate-y-[-4px]'} ${dropDirection === 'up' ? 'bottom-full mb-1 origin-bottom' : 'mt-1 top-full origin-top'}`}
          role="listbox"
          tabIndex={-1}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isFocused = index === focusedIndex;
            
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                className={`
                  px-3 min-h-12 cursor-pointer flex items-center justify-between transition-colors duration-120
                  ${isFocused ? 'bg-slate-50' : 'hover:bg-slate-50'}
                  ${isSelected ? 'text-blue-600 font-medium' : 'text-slate-700'}
                `}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check size={16} className="text-blue-600" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
