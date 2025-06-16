import { writable } from 'svelte/store';

export const dialogStore = writable({
  isOpen: false,
  title: '',
  message: '',
  type: 'info',
  confirmText: 'OK',
  cancelText: 'Cancel',
  showCancel: false,
  showConfirm: true,
  isDangerous: false,
  onConfirm: null,
  onCancel: null
});

export const dialogHelpers = {
  // Show info dialog
  info(title, message, options = {}) {
    return new Promise((resolve) => {
      dialogStore.set({
        isOpen: true,
        title,
        message,
        type: 'info',
        confirmText: options.confirmText || 'OK',
        cancelText: options.cancelText || 'Cancel',
        showCancel: false,
        showConfirm: true,
        isDangerous: false,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  },

  // Show success dialog
  success(title, message, options = {}) {
    return new Promise((resolve) => {
      dialogStore.set({
        isOpen: true,
        title,
        message,
        type: 'success',
        confirmText: options.confirmText || 'OK',
        cancelText: options.cancelText || 'Cancel',
        showCancel: false,
        showConfirm: true,
        isDangerous: false,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  },

  // Show warning dialog
  warning(title, message, options = {}) {
    return new Promise((resolve) => {
      dialogStore.set({
        isOpen: true,
        title,
        message,
        type: 'warning',
        confirmText: options.confirmText || 'OK',
        cancelText: options.cancelText || 'Cancel',
        showCancel: false,
        showConfirm: true,
        isDangerous: false,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  },

  // Show error dialog
  error(title, message, options = {}) {
    return new Promise((resolve) => {
      dialogStore.set({
        isOpen: true,
        title,
        message,
        type: 'error',
        confirmText: options.confirmText || 'OK',
        cancelText: options.cancelText || 'Cancel',
        showCancel: false,
        showConfirm: true,
        isDangerous: false,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  },

  // Show confirmation dialog
  confirm(title, message, options = {}) {
    return new Promise((resolve) => {
      dialogStore.set({
        isOpen: true,
        title,
        message,
        type: 'confirm',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        showCancel: true,
        showConfirm: true,
        isDangerous: options.isDangerous || false,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  },

  // Close dialog
  close() {
    dialogStore.update(state => ({ ...state, isOpen: false }));
  }
};
