import { MD3LightTheme, configureFonts } from 'react-native-paper';

// Font family names = keys loaded with useFonts in app/_layout.tsx.
export const FONT = {
  regular: 'Lexend_400Regular',
  semibold: 'Lexend_600SemiBold',
  bold: 'Lexend_700Bold',
};

export const colors = {
  primary: '#303F9F', // deep indigo: 9.8:1 against white (AA)
  onPrimary: '#FFFFFF',
  background: '#F5F6FA',
  surface: '#FFFFFF',
  text: '#1F2333',
  muted: '#4A5068', // secondary text: 7.9:1 against the background
  error: '#B3261E',
  success: '#2E7D57',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const MIN_TOUCH = 48;
export const PARALYSIS_HEIGHT = 120;

const base = configureFonts({ config: { fontFamily: FONT.regular } });
// Bold families carry their weight in the file, so fontWeight stays normal (avoids faux bold on Android).
const strong = (family: string) => ({ fontFamily: family, fontWeight: 'normal' as const });

const fonts = {
  ...base,
  bodyLarge: { ...base.bodyLarge, fontSize: 18, lineHeight: 27, letterSpacing: 0 },
  bodyMedium: { ...base.bodyMedium, fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  titleLarge: { ...base.titleLarge, ...strong(FONT.bold), fontSize: 24, lineHeight: 32 },
  titleMedium: { ...base.titleMedium, ...strong(FONT.semibold), fontSize: 20, lineHeight: 28, letterSpacing: 0 },
  headlineSmall: { ...base.headlineSmall, ...strong(FONT.bold), fontSize: 26, lineHeight: 34 },
  labelLarge: { ...base.labelLarge, ...strong(FONT.semibold), fontSize: 18, lineHeight: 24, letterSpacing: 0 },
};

export const theme = {
  ...MD3LightTheme,
  roundness: 4,
  fonts,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: colors.onPrimary,
    background: colors.background,
    surface: colors.surface,
    onSurface: colors.text,
    onSurfaceVariant: colors.muted,
    error: colors.error,
  },
};
