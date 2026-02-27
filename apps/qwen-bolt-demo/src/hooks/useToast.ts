'use client';

import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

let globalToastId = 0;

// Global listeners for cross-component toast triggering
type ToastListener = (toast: Toast) => void;
const listeners: Set<ToastListener> = new Set();

export function showToast(message: string, type: ToastType = 'info', duration = 3000) {
  const toast: Toast = {
    id: `toast-${++globalToastId}`,
    message,
    type,
    duration,
  };
  listeners.forEach(listener => listener(toast));
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    setToasts(prev => [...prev, toast]);

    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, toast.duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const subscribe = useCallback(() => {
    listeners.add(addToast);
    return () => {
      listeners.delete(addToast);
    };
  }, [addToast]);

  return { toasts, addToast, removeToast, subscribe };
}
