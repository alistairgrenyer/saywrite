/**
 * Draggable bubble component using feature-first architecture
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RecordingButton, RecordingMeter } from '@features/recorder';
import { ContextMenu } from '@shared/components/ContextMenu';
import { Position, RecordingState } from '@shared/lib/types';
import { zIndex } from '@shared/lib/design-tokens';
import '@/styles/shared.css';
import './DraggableBubble.css';

interface DraggableBubbleProps {
  recordingState: RecordingState;
  onToggleRecording: () => void;
  onOpenSettings: () => void;
  onExit: () => void;
  position: Position;
  onPositionChange: (position: Position) => void;
}

export function DraggableBubble({ 
  recordingState, 
  onToggleRecording, 
  onOpenSettings,
  onExit,
  position, 
  onPositionChange
}: DraggableBubbleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false
  });
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

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      visible: true
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
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

  const contextMenuItems = [
    {
      label: 'Settings',
      icon: '⚙️',
      onClick: onOpenSettings
    },
    {
      label: 'Exit',
      icon: '✕',
      onClick: onExit
    }
  ];

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

      <ContextMenu
        items={contextMenuItems}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        isVisible={contextMenu.visible}
        onClose={handleCloseContextMenu}
      />
    </>
  );
}
