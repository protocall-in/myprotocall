import { useState, useCallback } from 'react';
import ConfirmDialog from '../ui/ConfirmDialog';

export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default',
    onConfirm: () => {}
  });

  const confirm = useCallback(({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    destructive = false // Added for backward compatibility
  }) => {
    return new Promise((resolve) => {
      setConfig({
        title,
        message,
        confirmText,
        cancelText,
        variant: destructive ? 'destructive' : variant,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false), // Resolve promise as false on cancel
      });
      setIsOpen(true);
    });
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (config.onCancel) {
      config.onCancel();
    }
  }, [config]);

  const handleConfirm = useCallback(() => {
    config.onConfirm();
    setIsOpen(false);
  }, [config]);

  const ConfirmDialogComponent = useCallback(() => {
    if (!isOpen) return null;
    return (
      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={config.title}
        message={config.message}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
        variant={config.variant}
      />
    );
  }, [isOpen, handleClose, handleConfirm, config]);

  return {
    confirm,
    ConfirmDialog: ConfirmDialogComponent
  };
};