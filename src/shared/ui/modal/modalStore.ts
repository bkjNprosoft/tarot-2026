import { create } from 'zustand';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel: boolean;
}

interface ModalStore extends ModalState {
  showModal: (
    title: string,
    message: string,
    onConfirm?: () => void,
    onCancel?: () => void,
    showCancel?: boolean
  ) => void;
  closeModal: () => void;
}

const initialState: ModalState = {
  isOpen: false,
  title: '',
  message: '',
  onConfirm: undefined,
  onCancel: undefined,
  showCancel: true,
};

export const useModalStore = create<ModalStore>((set) => ({
  ...initialState,
  showModal: (title, message, onConfirm, onCancel, showCancel = true) => {
    set({
      isOpen: true,
      title,
      message,
      onConfirm,
      onCancel,
      showCancel,
    });
  },
  closeModal: () => {
    set(initialState);
  },
}));
