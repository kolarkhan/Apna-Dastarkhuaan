/**
 * Apna Dastarkhuaan design system — warm, food-forward, trustworthy.
 * Brand name/colors can be swapped here without touching any screen.
 */

export const colors = {
  // Primary: warm terracotta/paprika — appetite-driving, distinct from generic delivery-app red.
  primary: {
    50: "#FFF4ED",
    100: "#FFE6D5",
    200: "#FEC9A3",
    300: "#FDA36C",
    400: "#FB7A3C",
    500: "#F25C1F", // brand primary
    600: "#DC4515",
    700: "#B73512",
    800: "#8F2A12",
    900: "#742611",
  },
  // Secondary: deep saffron/gold — festive, homely accent.
  secondary: {
    50: "#FFFBEB",
    100: "#FFF3C4",
    200: "#FCE588",
    300: "#FADB5F",
    400: "#F7C948",
    500: "#E6A817", // secondary accent
    600: "#C8850F",
    700: "#A2650D",
    800: "#824E12",
    900: "#6C4012",
  },
  // Success: fresh herb green (order confirmed, verified, open)
  success: {
    50: "#F0FDF4",
    100: "#DCFCE7",
    300: "#86EFAC",
    500: "#22A559",
    600: "#178A48",
    700: "#136F3A",
  },
  warning: {
    50: "#FFFBEB",
    500: "#F5A524",
    700: "#B45309",
  },
  danger: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    500: "#EF4444",
    600: "#DC2626",
    700: "#B91C1C",
  },
  neutral: {
    0: "#FFFFFF",
    50: "#FAF9F7",
    100: "#F3F1EE",
    200: "#E7E3DE",
    300: "#D6D0C8",
    400: "#AFA79B",
    500: "#8A8177",
    600: "#665F57",
    700: "#4A443D",
    800: "#332F2A",
    900: "#1F1C19",
    950: "#141210",
  },
} as const;

export const typography = {
  fontFamily: {
    display: "Manrope_800ExtraBold",
    heading: "Manrope_700Bold",
    body: "Manrope_500Medium",
    bodyRegular: "Manrope_400Regular",
  },
  size: {
    display: 32,
    h1: 26,
    h2: 22,
    h3: 18,
    body: 15,
    bodySmall: 13,
    caption: 11,
    button: 16,
  },
  lineHeight: {
    display: 40,
    h1: 32,
    h2: 28,
    h3: 24,
    body: 22,
    bodySmall: 18,
    caption: 14,
    button: 20,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 56,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 28,
  full: 999,
} as const;

export const shadow = {
  sm: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

export const brand = {
  name: "Apna Dastarkhuaan",
  tagline: "Ghar jaisa khana, apne ghar ke qareeb.",
};
