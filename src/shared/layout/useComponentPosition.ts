/**
 * Simple hook for component positioning relative to bubble
 */
import { useMemo } from 'react';
import { Position, Size, PositioningConfig, calculatePosition, getBubbleSize } from './positioning';

interface UseComponentPositionOptions {
  bubblePosition: Position;
  componentSize: Size;
  config: PositioningConfig;
  isVisible?: boolean;
}

export function useComponentPosition({
  bubblePosition,
  componentSize,
  config,
  isVisible = true,
}: UseComponentPositionOptions): Position | null {
  const position = useMemo(() => {
    if (!isVisible) return null;
    
    const bubbleSize = getBubbleSize();
    return calculatePosition(bubblePosition, bubbleSize, componentSize, config);
  }, [bubblePosition, componentSize, config, isVisible]);

  return position;
}
