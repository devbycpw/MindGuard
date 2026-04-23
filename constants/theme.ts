// ============================================
// MindGuard AI — Design System
// ============================================

export const COLORS = {
  // Primary - Deep Navy
  primary: '#1E3A5F',
  primaryLight: '#2E5A8F',
  primaryDark: '#0F1D30',
  primarySoft: '#1E3A5F15',

  // Secondary - Purple
  secondary: '#7C5CFC',
  secondaryLight: '#A78BFA',
  secondaryDark: '#5B3FD9',
  secondarySoft: '#7C5CFC15',

  // Accent
  success: '#10B981',
  successLight: '#34D399',
  successSoft: '#10B98120',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningSoft: '#F59E0B20',
  danger: '#EF4444',
  dangerLight: '#F87171',
  dangerSoft: '#EF444420',
  info: '#3B82F6',
  infoLight: '#60A5FA',

  // Background
  background: '#F0F4F8',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceDark: '#0F172A',

  // Text
  textPrimary: '#1A202C',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#F1F5F9',

  // Border
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Mood colors
  mood1: '#EF4444',
  mood2: '#F97316',
  mood3: '#F59E0B',
  mood4: '#34D399',
  mood5: '#10B981',

  // Gradient
  gradientNavy: ['#1E3A5F', '#2E5A8F'] as const,
  gradientPurple: ['#7C5CFC', '#A78BFA'] as const,
  gradientMixed: ['#1E3A5F', '#7C5CFC'] as const,
  gradientSuccess: ['#10B981', '#34D399'] as const,
  gradientDanger: ['#EF4444', '#F87171'] as const,
  gradientWarm: ['#F59E0B', '#F97316'] as const,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  purple: {
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const MOOD_CONFIG = {
  1: { emoji: '😢', label: 'Sangat Buruk', color: COLORS.mood1 },
  2: { emoji: '😟', label: 'Buruk', color: COLORS.mood2 },
  3: { emoji: '😐', label: 'Biasa', color: COLORS.mood3 },
  4: { emoji: '🙂', label: 'Baik', color: COLORS.mood4 },
  5: { emoji: '😄', label: 'Sangat Baik', color: COLORS.mood5 },
} as const;

export const RISK_CONFIG = {
  getColor: (score: number) => {
    if (score <= 35) return COLORS.success;
    if (score <= 65) return COLORS.warning;
    return COLORS.danger;
  },
  getLabel: (score: number) => {
    if (score <= 35) return 'Aman';
    if (score <= 65) return 'Waspada';
    return 'Bahaya';
  },
  getLabelEn: (score: number) => {
    if (score <= 35) return 'Low Risk';
    if (score <= 65) return 'Medium Risk';
    return 'High Risk';
  },
};
