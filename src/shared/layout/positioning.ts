/**
 * Simple positioning utilities for layout management
 */
import { components } from '@shared/lib/design-tokens';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type ComponentSide = 'left' | 'right' | 'top' | 'bottom';

export interface PositioningConfig {
  preferredSide: ComponentSide;
  offset: Position;
  avoidOverlap: boolean;
  stickToScreen: boolean;
}

/**
 * Calculate component position relative to bubble
 */
export function calculatePosition(
  bubblePosition: Position,
  bubbleSize: Size,
  componentSize: Size,
  config: PositioningConfig
): Position {
  const { preferredSide, offset, stickToScreen } = config;
  
  let x = bubblePosition.x;
  let y = bubblePosition.y;

  // Calculate base position based on preferred side
  switch (preferredSide) {
    case 'left':
      x = bubblePosition.x - componentSize.width - offset.x;
      y = bubblePosition.y + offset.y;
      break;
    case 'right':
      x = bubblePosition.x + bubbleSize.width + offset.x;
      y = bubblePosition.y + offset.y;
      break;
    case 'top':
      x = bubblePosition.x + offset.x;
      y = bubblePosition.y - componentSize.height - offset.y;
      break;
    case 'bottom':
      x = bubblePosition.x + offset.x;
      y = bubblePosition.y + bubbleSize.height + offset.y;
      break;
  }

  // Keep component on screen if requested
  if (stickToScreen) {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    x = Math.max(0, Math.min(x, screenWidth - componentSize.width));
    y = Math.max(0, Math.min(y, screenHeight - componentSize.height));
  }

  return { x, y };
}

/**
 * Get bubble size from design tokens
 */
export function getBubbleSize(): Size {
  return components.bubble.size;
}
