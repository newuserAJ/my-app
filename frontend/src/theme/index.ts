export const theme = {
  colors: {
    primary: '#C35129',
    secondary: '#FFFFFF',
    text: '#000000',
    textSecondary: 'rgba(0, 0, 0, 0.4)',
    textPlaceholder: 'rgba(0, 0, 0, 0.3)',
    background: '#FFFFFF',
    inputBackground: '#FFFFFF',
    inputBorder: '#E5E5E5',
    buttonGradient: ['#FF8C00', '#FF4500'] as const,
    gray: {
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
    },
    error: '#FF0000',
  },
  fonts: {
    regular: 'Afacad-Regular',
    semiBold: 'Afacad-SemiBold',
    bold: 'Afacad-Bold',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};

export type Theme = typeof theme;
