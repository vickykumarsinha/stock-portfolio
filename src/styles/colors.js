// MoneyTrack Color Palette
// Calm and simple: White and Lavender theme

export const colors = {
  // Primary Colors (lavender theme)
  primary: {
    lavender: '#8b5cf6',      // blue-600
    lavenderLight: '#a78bfa', // blue-400
    lavenderDark: '#7c3aed',  // blue-600
    purple: '#9333ea',        // blue-600
    purpleLight: '#a855f7',   // blue-600
    purpleDark: '#7e22ce',    // purple-700
  },
  
  // Gradients
  gradients: {
    primary: 'from-blue-400 to-blue-600',
    primaryLight: 'from-blue-300 to-blue-400',
    primaryDark: 'from-blue-600 to-blue-600',
  },
  
  // Semantic Colors (using lavender palette)
  semantic: {
    success: '#10b981',    // emerald-500 (soft green)
    info: '#8b5cf6',       // blue-600
    warning: '#f59e0b',    // amber-500
    error: '#ef4444',      // red-500
  },
  
  // Neutral Colors
  neutral: {
    white: '#ffffff',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
  }
};

// Tailwind classes for easy use
export const tailwindColors = {
  // Primary gradient classes
  bgGradient: 'bg-gradient-to-r from-blue-400 to-blue-600',
  bgGradientLight: 'bg-gradient-to-r from-blue-300 to-blue-400',
  bgGradientDark: 'bg-gradient-to-r from-blue-600 to-blue-600',
  
  // Text gradient classes
  textGradient: 'bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent',
  
  // Hover states
  hoverLavender: 'hover:text-blue-600',
  hoverPurple: 'hover:text-blue-600',
  
  // Focus states
  focusLavender: 'focus:ring-blue-400 focus:border-blue-400',
  focusPurple: 'focus:ring-blue-400 focus:border-blue-400',
};
