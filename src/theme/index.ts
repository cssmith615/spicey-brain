export const colors = {
  // Brand
  primary: '#5B4FCF',
  primaryLight: '#7B6FDF',
  primaryDark: '#3B2FAF',

  // Accent (child view)
  accent: '#FF7043',
  accentLight: '#FF8A65',

  // Neutrals
  background: '#F8F7FF',
  surface: '#FFFFFF',
  border: '#E0DDF5',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#6B6B8D',
  textMuted: '#A0A0B8',

  // Status
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',

  // Child view specific
  childBackground: '#FFF8F0',
  childSurface: '#FFFFFF',
  childComplete: '#4CAF50',
  childPending: '#E8E4FF',
};

export const typography = {
  fontSizeXS: 11,
  fontSizeSM: 13,
  fontSizeMD: 15,
  fontSizeLG: 18,
  fontSizeXL: 22,
  fontSizeXXL: 28,
  fontSizeHero: 36,

  fontWeightRegular: '400' as const,
  fontWeightMedium: '500' as const,
  fontWeightSemiBold: '600' as const,
  fontWeightBold: '700' as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};
