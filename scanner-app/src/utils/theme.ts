import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra || {}) as any;

export const colors = {
  primary: extra.SWAGTIX_PRIMARY_COLOR || '#2B6CB0',
  secondary: extra.SWAGTIX_SECONDARY_COLOR || '#3182CE',
  success: extra.SWAGTIX_SUCCESS_COLOR || '#22C55E',
  error: extra.SWAGTIX_ERROR_COLOR || '#EF4444',
  warning: extra.SWAGTIX_WARNING_COLOR || '#F59E0B',
  background: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280'
};

export const statusToColor = (status: 'valid' | 'already' | 'invalid') => {
  switch (status) {
    case 'valid':
      return colors.success;
    case 'already':
      return colors.warning;
    default:
      return colors.error;
  }
};
