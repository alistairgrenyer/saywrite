/**
 * Draggable bubble component using feature-first architecture
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RecordingButton, RecordingMeter } from '@features/recorder';
import { Position, RecordingState } from '@shared/lib/types';
import { zIndex } from '@shared/lib/design-tokens';
import '@/styles/shared.css';
import './DraggableBubble.css';

interface DraggableBubbleProps {
  recordingState: RecordingState;
  onToggleRecording: () => void;
  position: Position;
  onPositionChange: (position: Position) => void;
  onContextMenu: (x: number, y: number) => void;
}

export function DraggableBubble({ 
  recordingState, 
  onToggleRecording, 
  position, 
  onPositionChange,
  onContextMenu
}: DraggableBubbleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!bubbleRef.current) return;
    
    const rect = bubbleRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    setHasDragged(false);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !bubbleRef.current) return;

    setHasDragged(true);

    // Cancel any pending animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Use requestAnimationFrame for smooth updates
    animationRef.current = requestAnimationFrame(() => {
      const newPosition = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      };

      // Apply transform directly for immediate visual feedback
      if (bubbleRef.current) {
        bubbleRef.current.style.transform = `translate3d(${newPosition.x}px, ${newPosition.y}px, 0)`;
      }

      // Update parent state
      onPositionChange(newPosition);
    });
  }, [isDragging, dragOffset, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(e.clientX, e.clientY);
  }, [onContextMenu]);

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

  // Sync position when not dragging
  useEffect(() => {
    if (!isDragging && bubbleRef.current) {
      bubbleRef.current.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
    }
  }, [position, isDragging]);

  return (
    <>
      <div 
        ref={bubbleRef}
        className={`draggable-bubble ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        style={{
          position: 'fixed',
          width: '120px',
          height: '120px',
          cursor: isDragging ? 'grabbing' : 'grab',
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          willChange: isDragging ? 'transform' : 'auto',
          zIndex: zIndex.bubble,
          pointerEvents: 'auto'
        }}
      >
        <div className="bubble-content">
          <RecordingButton
            recordingState={recordingState}
            onToggleRecording={(e?: React.MouseEvent) => {
              // Prevent recording if we just finished dragging
              if (hasDragged) {
                e?.preventDefault();
                return;
              }
              onToggleRecording();
            }}
          />
          
          <RecordingMeter
            audioLevel={recordingState.audioLevel}
            recordingDuration={recordingState.duration}
            recordingSize={recordingState.size}
            isVisible={recordingState.isRecording}
          />
        </div>
      </div>

    </>
  );
}
