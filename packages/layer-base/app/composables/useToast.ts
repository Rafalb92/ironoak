import { toast } from 'vue-sonner';

interface ToastAction {
  label: string;
  onClick: () => void;
}

export function useToast() {
  return {
    success: (message: string, description?: string, action?: ToastAction) =>
      toast.success(message, { description, action }),

    error: (message: string, description?: string, action?: ToastAction) =>
      toast.error(message, { description, action }),

    info: (message: string, description?: string, action?: ToastAction) =>
      toast(message, { description, action }),
  };
}