/**
 * Design tokens for consistent spacing, sizing, and positioning
 * Eliminates magic numbers throughout the application
 */

// Spacing scale (8px grid system)
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  xxxl: '64px',
} as const;

// Component dimensions
export const dimensions = {
  // Bubble
  bubble: {
    size: '60px',
    expandedSize: '80px',
  },
  
  // Panels
  panel: {
    minWidth: '320px',
    maxWidth: '600px',
    minHeight: '200px',
    borderRadius: '16px',
  },
  
  // Buttons
  button: {
    small: '20px',
    medium: '32px',
    large: '48px',
  },
  
  // Recording meter
  meter: {
    barWidth: '3px',
    barGap: '2px',
    barCount: 20,
    height: '40px',
  },
} as const;

// Z-index layers
export const zIndex = {
  base: 1,
  dropdown: 10,
  overlay: 100,
  transcript: 500,
  settings: 600,
  bubble: 1000,
  contextMenu: 1100,
  tooltip: 2000,
  toast: 3000,
} as const;

// Positioning offsets
export const offsets = {
  // Distance from bubble to other components
  fromBubble: {
    transcript: { x: 80, y: 0 },
    settings: { x: -320, y: 0 },
    rewrite: { x: 80, y: 220 },
    error: { x: 0, y: -80 },
    meter: { x: 0, y: 80 },
  },
  
  // Safe margins from screen edges
  screenMargin: {
    x: 20,
    y: 20,
  },
} as const;

// Animation durations
export const animations = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px',
} as const;

// Typography scale
export const typography = {
  fontSize: {
    xs: '10px',
    sm: '12px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    xxl: '24px',
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// Glass morphism effects
export const glass = {
  background: {
    dark: 'rgba(0, 0, 0, 0.95)',
    light: 'rgba(255, 255, 255, 0.1)',
  },
  
  border: {
    subtle: 'rgba(255, 255, 255, 0.2)',
    prominent: 'rgba(255, 255, 255, 0.3)',
  },
  
  blur: {
    light: 'blur(10px)',
    medium: 'blur(20px)',
    heavy: 'blur(40px)',
  },
  
  shadow: {
    subtle: '0 4px 6px rgba(0, 0, 0, 0.1)',
    medium: '0 8px 25px rgba(0, 0, 0, 0.15)',
    prominent: '0 25px 50px rgba(0, 0, 0, 0.25)',
  },
} as const;

// Color palette
export const colors = {
  primary: 'rgba(255, 255, 255, 0.9)',
  secondary: 'rgba(255, 255, 255, 0.7)',
  muted: 'rgba(255, 255, 255, 0.5)',
  
  success: 'rgba(34, 197, 94, 0.8)',
  warning: 'rgba(251, 191, 36, 0.8)',
  error: 'rgba(239, 68, 68, 0.8)',
  
  accent: 'rgba(59, 130, 246, 0.8)',
} as const;

// Helper functions for positioning
export const positioning = {
  /**
   * Calculate relative position based on parent position and offset
   */
  relative: (parentPos: { x: number; y: number }, offset: { x: number; y: number }) => ({
    x: parentPos.x + offset.x,
    y: parentPos.y + offset.y,
  }),
  
  /**
   * Ensure position stays within screen bounds
   */
  clampToScreen: (
    pos: { x: number; y: number },
    elementSize: { width: number; height: number },
    screenSize: { width: number; height: number } = {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  ) => ({
    x: Math.max(
      offsets.screenMargin.x,
      Math.min(pos.x, screenSize.width - elementSize.width - offsets.screenMargin.x)
    ),
    y: Math.max(
      offsets.screenMargin.y,
      Math.min(pos.y, screenSize.height - elementSize.height - offsets.screenMargin.y)
    ),
  }),
  
  /**
   * Get optimal position for a component relative to bubble
   */
  getOptimalPosition: (
    bubblePos: { x: number; y: number },
    componentType: keyof typeof offsets.fromBubble,
    elementSize: { width: number; height: number }
  ) => {
    const baseOffset = offsets.fromBubble[componentType];
    const relativePos = positioning.relative(bubblePos, baseOffset);
    return positioning.clampToScreen(relativePos, elementSize);
  },
};

// Component-specific layout configurations
export const components = {
  bubble: {
    size: { width: 120, height: 120 },
    styles: {
      borderRadius: '50%',
      background: glass.background.dark,
      border: `2px solid ${glass.border.subtle}`,
      backdropFilter: glass.blur.medium,
      boxShadow: glass.shadow.prominent,
    },
  },
  
  transcript: {
    size: { width: 400, height: 300 },
    minSize: { width: 320, height: 200 },
    maxSize: { width: 600, height: 500 },
    positioning: {
      preferredSide: 'right' as const,
      offset: { x: 20, y: 0 },
      avoidOverlap: true,
      stickToScreen: true,
    },
    styles: {
      borderRadius: dimensions.panel.borderRadius,
      background: glass.background.dark,
      border: `1px solid ${glass.border.subtle}`,
      backdropFilter: glass.blur.medium,
      boxShadow: glass.shadow.prominent,
      resize: 'both' as const,
      overflow: 'hidden' as const,
    },
  },
  
  settings: {
    size: { width: 320, height: 400 },
    minSize: { width: 280, height: 300 },
    maxSize: { width: 400, height: 600 },
    positioning: {
      preferredSide: 'left' as const,
      offset: { x: 20, y: 0 },
      avoidOverlap: true,
      stickToScreen: true,
    },
    styles: {
      borderRadius: dimensions.panel.borderRadius,
      background: glass.background.dark,
      border: `1px solid ${glass.border.subtle}`,
      backdropFilter: glass.blur.medium,
      boxShadow: glass.shadow.prominent,
    },
  },
  
  contextMenu: {
    size: { width: 150, height: 80 },
    minSize: { width: 120, height: 60 },
    positioning: {
      preferredSide: 'right' as const,
      offset: { x: 0, y: 0 },
      avoidOverlap: false,
      stickToScreen: true,
    },
    styles: {
      borderRadius: '8px',
      background: glass.background.dark,
      border: `1px solid ${glass.border.subtle}`,
      backdropFilter: glass.blur.medium,
      boxShadow: glass.shadow.prominent,
      padding: spacing.xs,
    },
  },
  
  error: {
    size: { width: 300, height: 100 },
    positioning: {
      preferredSide: 'top' as const,
      offset: { x: 0, y: 20 },
      avoidOverlap: true,
      stickToScreen: true,
    },
    styles: {
      borderRadius: '12px',
      background: 'rgba(239, 68, 68, 0.95)',
      border: `1px solid rgba(239, 68, 68, 0.3)`,
      backdropFilter: glass.blur.medium,
      boxShadow: glass.shadow.prominent,
    },
  },
} as const;
