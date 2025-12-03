import { useModalStore } from './modalStore';

export function useModal() {
  const showModal = useModalStore((state) => state.showModal);
  const closeModal = useModalStore((state) => state.closeModal);

  return {
    showConfirm: (
      title: string,
      message: string,
      onConfirm?: () => void,
      onCancel?: () => void
    ) => {
      showModal(title, message, onConfirm, onCancel, true);
    },
    showAlert: (title: string, message: string, onConfirm?: () => void) => {
      showModal(title, message, onConfirm, undefined, false);
    },
    closeModal,
  };
}

