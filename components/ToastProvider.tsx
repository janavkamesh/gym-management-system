'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type ToastType = 'success' | 'warning' | 'error';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts((prev) => {
      // Task 1: Deduplicate - ignore the new call if the message already exists
      if (prev.some((t) => t.message === message)) {
        return prev;
      }
      return [...prev, { id, message, type }];
    });

    // Task 2: Keep persistent errors (duration 0). The deduplication above stops them from stacking.
    const duration = type === 'error' ? 0 : type === 'warning' ? 4000 : 3000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => {
          // Only filter and return a new array if the toast is actually in the list
          if (!prev.some((t) => t.id === id)) return prev;
          return prev.filter((t) => t.id !== id);
        });
      }, duration);
    }
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-2xl text-sm font-medium flex items-center justify-between min-w-[300px] ${
              toast.type === 'success'
                ? 'bg-green-600 text-white'
                : toast.type === 'warning'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-red-600 text-white'
            }`}
          >
            <span>{toast.message}</span>
            {toast.type === 'error' && (
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-4 opacity-80 hover:opacity-100"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
