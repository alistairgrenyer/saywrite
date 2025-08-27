/**
 * Context menu component for right-click interactions
 */
import { useEffect, useRef } from 'react';
import { Paper, Stack, UnstyledButton, Text } from '@mantine/core';
import { colors, glass, zIndex, spacing } from '@shared/lib/design-tokens';

interface ContextMenuItem {
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  isVisible: boolean;
  onClose: () => void;
}

export function ContextMenu({ items, position, isVisible, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Add listeners after a brief delay to avoid immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <Paper
      ref={menuRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: zIndex.bubble + 100,
        minWidth: '150px',
        background: glass.background.dark,
        border: `1px solid ${glass.border.subtle}`,
        borderRadius: '8px',
        backdropFilter: glass.blur.medium,
        boxShadow: glass.shadow.prominent,
        padding: spacing.xs,
        pointerEvents: 'auto',
      }}
    >
      <Stack gap="xs">
        {items.map((item, index) => (
          <UnstyledButton
            key={index}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            disabled={item.disabled}
            style={{
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              color: item.disabled ? colors.muted : colors.secondary,
              backgroundColor: 'transparent',
              transition: 'background-color 150ms ease',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 1,
            }}
            styles={{
              root: {
                '&:hover': !item.disabled ? {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: colors.primary,
                } : {},
              },
            }}
          >
            {item.icon && (
              <span style={{ fontSize: '14px', minWidth: '16px' }}>
                {item.icon}
              </span>
            )}
            <Text size="sm" style={{ color: 'inherit' }}>
              {item.label}
            </Text>
          </UnstyledButton>
        ))}
      </Stack>
    </Paper>
  );
}
