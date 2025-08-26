import React, { useState, useRef, useCallback, useEffect } from 'react';
import './DraggableBubble.css';

interface DraggableBubbleProps {
  recording: boolean;
  isInitializing: boolean;
  onToggleRecording: () => void;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
}

export function DraggableBubble({ 
  recording, 
  isInitializing, 
  onToggleRecording, 
  position, 
  onPositionChange 
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

      // Update parent state less frequently
      onPositionChange(newPosition);
    });
  }, [isDragging, dragOffset, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

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
    <div 
      ref={bubbleRef}
      className={`draggable-bubble ${isDragging ? 'dragging' : ''}`}
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        width: '120px',
        height: '120px',
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        willChange: isDragging ? 'transform' : 'auto',
        pointerEvents: 'auto'
      }}
    >
      <div className="bubble-content">
        <button
          onClick={(e) => {
            // Prevent recording if we just finished dragging
            if (hasDragged) {
              e.preventDefault();
              return;
            }
            onToggleRecording();
          }}
          disabled={isInitializing}
          className={`main-mic-button ${recording ? 'recording' : 'idle'} ${isInitializing ? 'initializing' : ''}`}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
        >
          {recording ? (
            <div className="recording-indicator">
              <div className="pulse-ring"></div>
              <div className="recording-dot"></div>
            </div>
          ) : (
            <div className="mic-icon">
              {!isInitializing && '🎤'}
              {isInitializing && '⏳'}
            </div>
          )}
        </button>
        
        <button className="settings-button" aria-label="Settings">
          ⚙️
        </button>
      </div>
    </div>
  );
}
