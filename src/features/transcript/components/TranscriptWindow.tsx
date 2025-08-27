/**
 * Transcript window component with editing capabilities
 * Moved from src/components/TranscriptWindow.tsx
 */
import { useState, useEffect } from 'react';
import { AudioPlayback } from './AudioPlayback';
import { GlassPanel } from '@shared/components/GlassPanel';
import { Position } from '@shared/lib/types';
import { useRelativePosition } from '@shared/hooks/useRelativePosition';
import { dimensions, zIndex, typography, colors } from '@shared/lib/design-tokens';
import '@/styles/shared.css';
import './TranscriptWindow.css';

interface TranscriptWindowProps {
  text: string;
  isProcessing?: boolean;
  bubblePosition: Position;
  onClose: () => void;
  audioData?: ArrayBuffer;
  recordingDuration?: number;
}

export function TranscriptWindow({ 
  text, 
  isProcessing = false, 
  bubblePosition, 
  onClose, 
  audioData, 
  recordingDuration = 0 
}: TranscriptWindowProps) {
  const [editableText, setEditableText] = useState(text);

  // Use relative positioning based on bubble position
  const { position } = useRelativePosition({
    parentPosition: bubblePosition,
    componentType: 'transcript',
    elementSize: { 
      width: parseInt(dimensions.panel.maxWidth), 
      height: parseInt(dimensions.panel.minHeight) 
    },
  });

  useEffect(() => {
    setEditableText(text);
  }, [text]);

  if (!text && !isProcessing) return null;

  return (
    <GlassPanel
      className="transcript-window"
      animate={true}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: zIndex.modal,
        maxWidth: dimensions.panel.maxWidth,
        minWidth: dimensions.panel.minWidth,
        minHeight: dimensions.panel.minHeight,
        resize: 'both',
        overflow: 'auto'
      }}
    >
      <div className="transcript-content">
        <div className="transcript-header">
          <span className="text-primary" style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transcription</span>
          <button className="glass-button" onClick={onClose} style={{ width: dimensions.button.small, height: dimensions.button.small, fontSize: typography.fontSize.lg, color: colors.secondary }}>×</button>
        </div>
        
        {!isProcessing && audioData && (
          <AudioPlayback
            audioData={audioData}
            duration={recordingDuration}
          />
        )}
        
        <div className="transcript-text">
          {isProcessing ? (
            <div className="processing-indicator">
              <span>Processing</span>
              <div className="dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </div>
            </div>
          ) : (
            <textarea
              className="glass-input"
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              placeholder="Your transcription will appear here..."
              rows={6}
              style={{ width: '100%', height: '100%', minHeight: '120px', resize: 'none', fontSize: typography.fontSize.base }}
            />
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
