import { create } from 'zustand';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastState {
  readonly open: boolean;
  readonly message: string;
  readonly variant: ToastVariant;
}

interface ToastActions {
  readonly show: (message: string, variant?: ToastVariant) => void;
  readonly hide: () => void;
}

const initialState: ToastState = {
  open: false,
  message: '',
  variant: 'info',
};

export const useToast = create<ToastState & ToastActions>()((set) => ({
  ...initialState,

  show: (message, variant = 'info') => set({ open: true, message, variant }),

  hide: () => set({ open: false }),
}));
