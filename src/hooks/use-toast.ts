import { toast } from "sonner";

export const useToast = () => {
  return {
    toast: (message: string, options?: { description?: string; type?: 'success' | 'error' | 'info' }) => {
      if (options?.type === 'error') {
        toast.error(message, { description: options?.description });
      } else if (options?.type === 'success') {
        toast.success(message, { description: options?.description });
      } else {
        toast(message, { description: options?.description });
      }
    },
  };
};
