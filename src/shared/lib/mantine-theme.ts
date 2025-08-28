/**
 * Mantine theme configuration matching SayWrite's glass morphism design
 */
import { MantineThemeOverride } from '@mantine/core';
import { colors, glass, typography, spacing, dimensions, animations } from './design-tokens';

export const mantineTheme: MantineThemeOverride = {
  colors: {
    // Custom color palette matching design tokens
    glass: [
      'rgba(255, 255, 255, 0.05)',
      'rgba(255, 255, 255, 0.1)',
      'rgba(255, 255, 255, 0.2)',
      'rgba(255, 255, 255, 0.3)',
      'rgba(255, 255, 255, 0.4)',
      'rgba(255, 255, 255, 0.5)',
      'rgba(255, 255, 255, 0.6)',
      'rgba(255, 255, 255, 0.7)',
      'rgba(255, 255, 255, 0.8)',
      'rgba(255, 255, 255, 0.9)',
    ],
    primary: [
      'rgba(59, 130, 246, 0.1)',
      'rgba(59, 130, 246, 0.2)',
      'rgba(59, 130, 246, 0.3)',
      'rgba(59, 130, 246, 0.4)',
      'rgba(59, 130, 246, 0.5)',
      'rgba(59, 130, 246, 0.6)',
      'rgba(59, 130, 246, 0.7)',
      'rgba(59, 130, 246, 0.8)',
      'rgba(59, 130, 246, 0.9)',
      'rgba(59, 130, 246, 1)',
    ],
  },

  primaryColor: 'primary',
  primaryShade: 7,
  
  defaultRadius: 'md',

  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSizes: {
    xs: typography.fontSize.xs,
    sm: typography.fontSize.sm,
    md: typography.fontSize.base,
    lg: typography.fontSize.lg,
    xl: typography.fontSize.xl,
  },

  spacing: {
    xs: spacing.xs,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
  },

  radius: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: dimensions.panel.borderRadius,
    xl: '20px',
  },

  shadows: {
    xs: glass.shadow.subtle,
    sm: glass.shadow.subtle,
    md: glass.shadow.medium,
    lg: glass.shadow.prominent,
    xl: glass.shadow.prominent,
  },

  components: {
    Modal: {
      styles: {
        modal: {
          background: glass.background.dark,
          border: `1px solid ${glass.border.subtle}`,
          borderRadius: dimensions.panel.borderRadius,
          backdropFilter: glass.blur.medium,
          boxShadow: glass.shadow.prominent,
        },
        header: {
          background: 'transparent',
          borderBottom: `1px solid ${glass.border.subtle}`,
          padding: spacing.md,
        },
        body: {
          padding: spacing.md,
        },
        title: {
          color: colors.primary,
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
        },
      },
    },

    Paper: {
      styles: {
        root: {
          background: glass.background.dark,
          border: `1px solid ${glass.border.subtle}`,
          borderRadius: dimensions.panel.borderRadius,
          backdropFilter: glass.blur.medium,
          boxShadow: glass.shadow.medium,
        },
      },
    },

    Button: {
      styles: {
        root: {
          background: 'rgba(255, 255, 255, 0.1)',
          border: `1px solid ${glass.border.subtle}`,
          color: colors.primary,
          backdropFilter: glass.blur.light,
          transition: `all ${animations.fast} ease`,
          
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.2)',
            border: `1px solid ${glass.border.prominent}`,
            transform: 'translateY(-1px)',
          },
          
          '&:active': {
            transform: 'translateY(0)',
          },
        },
      },
    },

    TextInput: {
      styles: {
        input: {
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${glass.border.subtle}`,
          borderRadius: '8px',
          color: colors.primary,
          backdropFilter: glass.blur.light,
          
          '&:focus': {
            border: `1px solid ${glass.border.prominent}`,
            background: 'rgba(255, 255, 255, 0.1)',
          },
          
          '&::placeholder': {
            color: colors.muted,
          },
        },
        label: {
          color: colors.secondary,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
        },
      },
    },

    Textarea: {
      styles: {
        input: {
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${glass.border.subtle}`,
          borderRadius: '8px',
          color: colors.primary,
          backdropFilter: glass.blur.light,
          
          '&:focus': {
            border: `1px solid ${glass.border.prominent}`,
            background: 'rgba(255, 255, 255, 0.1)',
          },
          
          '&::placeholder': {
            color: colors.muted,
          },
        },
        label: {
          color: colors.secondary,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
        },
      },
    },

    Select: {
      styles: {
        input: {
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${glass.border.subtle}`,
          borderRadius: '8px',
          color: colors.primary,
          backdropFilter: glass.blur.light,
          
          '&:focus': {
            border: `1px solid ${glass.border.prominent}`,
            background: 'rgba(255, 255, 255, 0.1)',
          },
        },
        dropdown: {
          background: glass.background.dark,
          border: `1px solid ${glass.border.subtle}`,
          borderRadius: '8px',
          backdropFilter: glass.blur.medium,
          boxShadow: glass.shadow.medium,
        },
        item: {
          color: colors.secondary,
          
          '&[data-selected]': {
            background: 'rgba(59, 130, 246, 0.2)',
            color: colors.primary,
          },
          
          '&[data-hovered]': {
            background: 'rgba(255, 255, 255, 0.1)',
            color: colors.primary,
          },
        },
        label: {
          color: colors.secondary,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
        },
      },
    },

    Checkbox: {
      styles: {
        input: {
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${glass.border.subtle}`,
          
          '&:checked': {
            background: colors.accent,
            border: `1px solid ${colors.accent}`,
          },
        },
        label: {
          color: colors.secondary,
          fontSize: typography.fontSize.sm,
        },
      },
    },

    Slider: {
      styles: {
        track: {
          background: 'rgba(255, 255, 255, 0.1)',
        },
        bar: {
          background: colors.accent,
        },
        thumb: {
          background: colors.primary,
          border: `2px solid ${colors.accent}`,
        },
      },
    },

    Tabs: {
      styles: {
        tab: {
          background: 'transparent',
          border: 'none',
          color: colors.muted,
          borderRadius: '8px',
          transition: `all ${animations.fast} ease`,
          
          '&[data-active]': {
            background: 'rgba(255, 255, 255, 0.1)',
            color: colors.primary,
            border: `1px solid ${glass.border.subtle}`,
          },
          
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.05)',
            color: colors.secondary,
          },
        },
        tabsList: {
          background: 'transparent',
          border: 'none',
          gap: spacing.xs,
        },
      },
    },

    ActionIcon: {
      styles: {
        root: {
          background: 'rgba(255, 255, 255, 0.1)',
          border: `1px solid ${glass.border.subtle}`,
          color: colors.secondary,
          backdropFilter: glass.blur.light,
          transition: `all ${animations.fast} ease`,
          
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.2)',
            color: colors.primary,
            transform: 'translateY(-1px)',
          },
        },
      },
    },

    Text: {
      styles: {
        root: {
          color: colors.secondary,
        },
      },
    },

    Title: {
      styles: {
        root: {
          color: colors.primary,
        },
      },
    },
  },

};
