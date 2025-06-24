import { notifications } from '@mantine/notifications';

export const useToast = () => {
  return {
    toast: (message: string, options?: { description?: string; type?: 'success' | 'error' | 'info' }) => {
      const color = options?.type === 'error' ? 'red' : options?.type === 'success' ? 'green' : 'blue';
      
      notifications.show({
        title: message,
        message: options?.description || '',
        color: color,
        autoClose: 5000,
      });
    },
  };
};
