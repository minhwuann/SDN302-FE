import { heroui } from "@heroui/react";

/**
 * Ví Vi Vu design tokens (HeroUI plugin cho Tailwind v4).
 * Được nạp qua `@plugin "../hero.js"` trong src/index.css.
 * Giữ NGUYÊN bảng màu cool-neutral + cobalt và thang bo góc từ bản redesign.
 */

// Thang cobalt cho primary action (WCAG AA với chữ trắng ở 500+)
const cobalt = {
  50: "#EFF5FF",
  100: "#DBE7FE",
  200: "#BFD3FE",
  300: "#93B4FD",
  400: "#6090FA",
  500: "#2563EB",
  600: "#1D4FD8",
  700: "#1A43B8",
  800: "#1B3C95",
  900: "#1B3576",
};

const emerald = {
  50: "#ECFDF5",
  100: "#D1FAE5",
  200: "#A7F3D0",
  300: "#6EE7B7",
  400: "#34D399",
  500: "#10B981",
  600: "#059669",
  700: "#047857",
  800: "#065F46",
  900: "#064E3B",
};

const red = {
  50: "#FEF2F2",
  100: "#FEE2E2",
  200: "#FECACA",
  300: "#FCA5A5",
  400: "#F87171",
  500: "#EF4444",
  600: "#DC2626",
  700: "#B91C1C",
  800: "#991B1B",
  900: "#7F1D1D",
};

const amber = {
  50: "#FFFBEB",
  100: "#FEF3C7",
  200: "#FDE68A",
  300: "#FCD34D",
  400: "#FBBF24",
  500: "#F59E0B",
  600: "#D97706",
  700: "#B45309",
  800: "#92400E",
  900: "#78350F",
};

export default heroui({
  layout: {
    radius: {
      small: "8px", // small nested controls
      medium: "10px", // inputs, buttons
      large: "14px", // cards, surfaces
    },
    borderWidth: {
      small: "1px",
      medium: "1px", // border card mặc định 1px
      large: "2px",
    },
    disabledOpacity: 0.5,
  },
  themes: {
    light: {
      colors: {
        background: "#F6F8FB",
        foreground: "#0F172A",
        focus: cobalt[500],
        divider: "#E2E8F0",
        content1: "#FFFFFF",
        content2: "#F0F4F8",
        content3: "#E7EDF3",
        content4: "#DCE3EC",
        default: {
          50: "#F6F8FB",
          100: "#EEF2F7",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#526071",
          700: "#3D4a5c",
          800: "#27303c",
          900: "#0F172A",
          foreground: "#0F172A",
          DEFAULT: "#E2E8F0",
        },
        primary: { ...cobalt, foreground: "#FFFFFF", DEFAULT: cobalt[500] },
        success: { ...emerald, foreground: "#FFFFFF", DEFAULT: emerald[600] },
        danger: { ...red, foreground: "#FFFFFF", DEFAULT: red[600] },
        warning: { ...amber, foreground: "#0F172A", DEFAULT: amber[500] },
      },
    },
    dark: {
      colors: {
        background: "#0B1018",
        foreground: "#F1F5F9",
        focus: cobalt[400],
        divider: "#263244",
        content1: "#121A26",
        content2: "#182231",
        content3: "#1F2B3B",
        content4: "#273549",
        default: {
          50: "#0F1621",
          100: "#182231",
          200: "#263244",
          300: "#33445c",
          400: "#4a5d78",
          500: "#6b7c94",
          600: "#9BA9BA",
          700: "#c2ccd8",
          800: "#e2e8ef",
          900: "#F1F5F9",
          foreground: "#F1F5F9",
          DEFAULT: "#263244",
        },
        primary: { ...cobalt, foreground: "#FFFFFF", DEFAULT: cobalt[500] },
        success: { ...emerald, foreground: "#04140E", DEFAULT: emerald[500] },
        danger: { ...red, foreground: "#FFFFFF", DEFAULT: red[500] },
        warning: { ...amber, foreground: "#0F172A", DEFAULT: amber[400] },
      },
    },
  },
});
