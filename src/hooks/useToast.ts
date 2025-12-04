import { useToastStore } from '@/lib/stores/toastStore';
import type { ToastType } from '@/lib/stores/toastStore';

export function useToast() {
  const showToast = useToastStore((state) => state.showToast);

  return {
    showToast: (
      message: string,
      type?: ToastType,
      duration?: number,
      showCloseButton?: boolean
    ) => {
      showToast(message, type, duration, showCloseButton);
    },
    showSuccess: (
      message: string,
      duration?: number,
      showCloseButton?: boolean
    ) => {
      showToast(message, 'success', duration, showCloseButton);
    },
    showError: (
      message: string,
      duration?: number,
      showCloseButton?: boolean
    ) => {
      showToast(message, 'error', duration, showCloseButton);
    },
    showInfo: (
      message: string,
      duration?: number,
      showCloseButton?: boolean
    ) => {
      showToast(message, 'info', duration, showCloseButton);
    },
  };
}
