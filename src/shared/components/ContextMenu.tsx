/**
 * Context menu component for right-click interactions
 */
import { useEffect, useRef } from 'react';
import { Paper, Stack, UnstyledButton, Text } from '@mantine/core';
import { useComponentPosition } from '@shared/layout/useComponentPosition';
import { Position } from '@shared/layout/positioning';
import { zIndex, colors, components, spacing } from '@shared/lib/design-tokens';

interface ContextMenuItem {
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  isVisible: boolean;
  onClose: () => void;
  bubblePosition: Position;
}

export function ContextMenu({ items, isVisible, onClose, bubblePosition }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Use simplified positioning system
  const calculatedPosition = useComponentPosition({
    bubblePosition,
    componentSize: components.contextMenu.size,
    config: components.contextMenu.positioning,
    isVisible,
  });

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
  if (!calculatedPosition) return null; // Don't render until we have a position

  return (
    <Paper
      ref={menuRef}
      style={{
        position: 'fixed',
        left: `${calculatedPosition.x}px`,
        top: `${calculatedPosition.y}px`,
        zIndex: zIndex.contextMenu,
        minWidth: components.contextMenu.size.width,
        background: components.contextMenu.styles.background,
        border: components.contextMenu.styles.border,
        borderRadius: components.contextMenu.styles.borderRadius,
        backdropFilter: components.contextMenu.styles.backdropFilter,
        boxShadow: components.contextMenu.styles.boxShadow,
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
