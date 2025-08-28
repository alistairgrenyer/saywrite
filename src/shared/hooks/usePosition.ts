/**
 * Hook for managing draggable position state
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { Position } from '@shared/lib/types';

export interface UsePositionOptions {
  initialPosition: Position;
  onPositionChange?: (position: Position) => void;
}

export interface UsePositionReturn {
  position: Position;
  isDragging: boolean;
  dragHandlers: {
    onMouseDown: (e: React.MouseEvent) => void;
  };
  setPosition: (position: Position) => void;
}

export const usePosition = ({ 
  initialPosition, 
  onPositionChange 
}: UsePositionOptions): UsePositionReturn => {
  const [position, setPositionState] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const elementRef = useRef<HTMLElement | null>(null);
  const animationRef = useRef<number>();

  const setPosition = useCallback((newPosition: Position) => {
    setPositionState(newPosition);
    onPositionChange?.(newPosition);
  }, [onPositionChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const element = e.currentTarget as HTMLElement;
    elementRef.current = element;
    
    const rect = element.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !elementRef.current) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    animationRef.current = requestAnimationFrame(() => {
      const newPosition = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      };

      if (elementRef.current) {
        elementRef.current.style.transform = `translate3d(${newPosition.x}px, ${newPosition.y}px, 0)`;
      }

      setPosition(newPosition);
    });
  }, [isDragging, dragOffset, setPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    position,
    isDragging,
    dragHandlers: {
      onMouseDown: handleMouseDown
    },
    setPosition
  };
};
