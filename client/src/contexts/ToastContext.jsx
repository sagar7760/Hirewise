import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ToastContext = createContext(null);

/**
 * ToastProvider provides global toast notifications.
 * Usage:
 * const toast = useToast();
 * toast.success('Saved'); toast.error('Failed'); toast.show('custom type message', {type:'info'});
 */
export const ToastProvider = ({ children, autoDismiss = 4000, maxToasts = 4 }) => {
  const [toasts, setToasts] = useState([]); // { id, type, message }

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((type, message, options = {}) => {
    if (!message) return null;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    setToasts(prev => {
      const next = [...prev, { id, type, message }];
      return next.slice(-maxToasts);
    });
    if (options.persist !== true) {
      setTimeout(() => remove(id), options.duration || autoDismiss);
    }
    return id;
  }, [autoDismiss, maxToasts, remove]);

  // Memoize context value so consumers don't see a new identity every render
  const api = useMemo(() => ({
    show: (message, options) => push(options?.type || 'info', message, options),
    success: (message, options) => push('success', message, options),
    error: (message, options) => push('error', message, options),
    info: (message, options) => push('info', message, options),
    warning: (message, options) => push('warning', message, options),
    remove
  }), [push, remove]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Toast Portal */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col space-y-3 w-80">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow font-['Roboto'] text-sm border relative overflow-hidden group transition-colors duration-200
              ${t.type==='success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700' : ''}
              ${t.type==='error' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700' : ''}
              ${t.type==='warning' ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700' : ''}
              ${t.type==='info' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700' : ''}
            `}
          >
            <div className="flex justify-between items-start space-x-3">
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                className="text-xs opacity-60 hover:opacity-100 focus:outline-none"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
