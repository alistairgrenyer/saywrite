/**
 * Hook for managing relative positioning of components
 * Eliminates hardcoded positions and provides smart positioning logic
 */
import { useState, useCallback, useEffect } from 'react';
import { Position } from '@shared/lib/types';
import { positioning, offsets } from '@shared/lib/design-tokens';

export interface UseRelativePositionOptions {
  parentPosition: Position;
  componentType: keyof typeof offsets.fromBubble;
  elementSize?: { width: number; height: number };
  enabled?: boolean;
}

export interface UseRelativePositionReturn {
  position: Position;
  updatePosition: (newPosition: Position) => void;
  resetToOptimal: () => void;
  isOptimalPosition: boolean;
}

export function useRelativePosition({
  parentPosition,
  componentType,
  elementSize = { width: 320, height: 200 },
  enabled = true,
}: UseRelativePositionOptions): UseRelativePositionReturn {
  // Calculate optimal position based on parent and component type
  const getOptimalPosition = useCallback(() => {
    if (!enabled) return { x: 0, y: 0 };
    return positioning.getOptimalPosition(parentPosition, componentType, elementSize);
  }, [parentPosition, componentType, elementSize, enabled]);

  const [position, setPosition] = useState<Position>(getOptimalPosition);
  const [hasBeenManuallyMoved, setHasBeenManuallyMoved] = useState(false);

  // Update position when parent moves (only if not manually positioned)
  useEffect(() => {
    if (!hasBeenManuallyMoved && enabled) {
      setPosition(getOptimalPosition());
    }
  }, [parentPosition, getOptimalPosition, hasBeenManuallyMoved, enabled]);

  // Update position when screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (enabled) {
        const clampedPosition = positioning.clampToScreen(position, elementSize);
        if (clampedPosition.x !== position.x || clampedPosition.y !== position.y) {
          setPosition(clampedPosition);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position, elementSize, enabled]);

  const updatePosition = useCallback((newPosition: Position) => {
    setPosition(newPosition);
    setHasBeenManuallyMoved(true);
  }, []);

  const resetToOptimal = useCallback(() => {
    setPosition(getOptimalPosition());
    setHasBeenManuallyMoved(false);
  }, [getOptimalPosition]);

  // Check if current position matches optimal position
  const optimalPosition = getOptimalPosition();
  const isOptimalPosition = !hasBeenManuallyMoved && 
    Math.abs(position.x - optimalPosition.x) < 5 && 
    Math.abs(position.y - optimalPosition.y) < 5;

  return {
    position,
    updatePosition,
    resetToOptimal,
    isOptimalPosition,
  };
}
