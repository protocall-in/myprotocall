import { toast as sonnerToast } from 'sonner';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export const toast = {
  success: (message, options = {}) => {
    return sonnerToast.success(message, {
      icon: <CheckCircle className="w-4 h-4" />,
      ...options
    });
  },
  
  error: (message, options = {}) => {
    return sonnerToast.error(message, {
      icon: <XCircle className="w-4 h-4" />,
      ...options
    });
  },
  
  warning: (message, options = {}) => {
    return sonnerToast.warning(message, {
      icon: <AlertTriangle className="w-4 h-4" />,
      ...options
    });
  },
  
  info: (message, options = {}) => {
    return sonnerToast.info(message, {
      icon: <Info className="w-4 h-4" />,
      ...options
    });
  },
  
  promise: (promise, options) => {
    return sonnerToast.promise(promise, {
      loading: 'Processing...',
      success: 'Operation completed successfully!',
      error: 'Something went wrong. Please try again.',
      ...options
    });
  }
};

export default toast;