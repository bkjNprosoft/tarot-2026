'use client';

import { motion } from 'framer-motion';
import { Toast as ToastType } from '@/lib/stores/toastStore';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

export function Toast({ toast, onRemove }: ToastProps) {
  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-green-500/20',
          border: 'border-green-500/50',
          text: 'text-green-400',
          icon: '✓',
        };
      case 'error':
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500/50',
          text: 'text-red-400',
          icon: '✕',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/50',
          text: 'text-blue-400',
          icon: 'ℹ',
        };
    }
  };

  const styles = getToastStyles();

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.3 }}
      className={`${styles.bg} ${styles.border} border rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm min-w-[300px] max-w-[500px] flex items-center gap-3`}
    >
      <span className={`${styles.text} font-bold text-lg flex-shrink-0`}>
        {styles.icon}
      </span>
      <p className={`${styles.text} flex-grow text-sm font-medium`}>
        {toast.message}
      </p>
      {toast.showCloseButton && (
        <button
          onClick={() => onRemove(toast.id)}
          className={`${styles.text} hover:opacity-70 transition-opacity flex-shrink-0 text-lg font-bold`}
          aria-label="닫기"
        >
          ×
        </button>
      )}
    </motion.div>
  );
}
