import { createContext, useCallback, useState } from 'react';

export const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const notify = useCallback((message, type = 'success') => { const id = crypto.randomUUID(); setToasts((all) => [...all, { id, message, type }]); setTimeout(() => setToasts((all) => all.filter((toast) => toast.id !== id)), 4200); }, []);
  return <ToastContext.Provider value={{ notify }}>{children}<div className="toast-region" aria-live="polite">{toasts.map((toast) => <div className={`toast toast-${toast.type}`} key={toast.id}><span>{toast.type === 'success' ? '✓' : '!'}</span>{toast.message}<button onClick={() => setToasts((all) => all.filter((item) => item.id !== toast.id))} aria-label="Dismiss notification">×</button></div>)}</div></ToastContext.Provider>;
}
