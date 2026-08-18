import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const MAX_TOASTS = 3;
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (toast) => {
    const currentToasts = get().toasts;

    // 1. Chặn spam thông báo trùng lặp đang hiển thị
    const duplicate = currentToasts.find(
      (t) => t.message === toast.message && t.type === toast.type
    );
    if (duplicate) {
      // Đã có thông báo này -> reset timer và không tạo thêm phần tử DOM mới
      if (toastTimeouts.has(duplicate.id)) {
        clearTimeout(toastTimeouts.get(duplicate.id)!);
      }
      const duration = toast.duration !== undefined ? toast.duration : 3000;
      if (duration > 0) {
        const timeout = setTimeout(() => {
          get().removeToast(duplicate.id);
        }, duration);
        toastTimeouts.set(duplicate.id, timeout);
      }
      return;
    }

    const id = Math.random().toString(36).substring(2, 9);
    
    // 2. Giới hạn tối đa MAX_TOASTS cùng lúc, tự hủy toast cũ nhất
    let updatedToasts = [...currentToasts, { ...toast, id }];
    if (updatedToasts.length > MAX_TOASTS) {
      const removed = updatedToasts.shift();
      if (removed && toastTimeouts.has(removed.id)) {
        clearTimeout(toastTimeouts.get(removed.id)!);
        toastTimeouts.delete(removed.id);
      }
    }

    set({ toasts: updatedToasts });

    // Auto remove toast
    const duration = toast.duration !== undefined ? toast.duration : 3000;
    if (duration > 0) {
      const timeout = setTimeout(() => {
        get().removeToast(id);
      }, duration);
      toastTimeouts.set(id, timeout);
    }
  },
  removeToast: (id) => {
    if (toastTimeouts.has(id)) {
      clearTimeout(toastTimeouts.get(id)!);
      toastTimeouts.delete(id);
    }
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
