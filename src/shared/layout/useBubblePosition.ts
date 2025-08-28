/**
 * Simple hook to manage bubble position state
 */
import { useState, useCallback } from 'react';
import { Position } from './positioning';

export function useBubblePosition(initialPosition: Position = { x: 100, y: 100 }) {
  const [bubblePosition, setBubblePosition] = useState<Position>(initialPosition);

  const updateBubblePosition = useCallback((newPosition: Position) => {
    setBubblePosition(newPosition);
  }, []);

  return {
    bubblePosition,
    updateBubblePosition,
  };
}
