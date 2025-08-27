/**
 * Transcript window component with editing capabilities
 * Moved from src/components/TranscriptWindow.tsx
 */
import { useState, useEffect } from 'react';
import { AudioPlayback } from './AudioPlayback';
import { GlassPanel } from '@shared/components/GlassPanel';
import { Position } from '@shared/lib/types';
import '@/styles/shared.css';
import './TranscriptWindow.css';

interface TranscriptWindowProps {
  text: string;
  isProcessing?: boolean;
  position: Position;
  onClose: () => void;
  audioData?: ArrayBuffer;
  recordingDuration?: number;
}

export function TranscriptWindow({ 
  text, 
  isProcessing = false, 
  position, 
  onClose, 
  audioData, 
  recordingDuration = 0 
}: TranscriptWindowProps) {
  const [editableText, setEditableText] = useState(text);
  
  // Update editable text when new transcript arrives
  useEffect(() => {
    if (text && text !== editableText) {
      setEditableText(text);
    }
  }, [text, editableText]);

  if (!text && !isProcessing) return null;

  return (
    <GlassPanel
      className="transcript-window"
      animate={true}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        maxWidth: '600px',
        minWidth: '320px',
        minHeight: '200px',
        resize: 'both',
        overflow: 'auto'
      }}
    >
      <div className="transcript-content">
        <div className="transcript-header">
          <span className="text-primary" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transcription</span>
          <button className="glass-button" onClick={onClose} style={{ width: '20px', height: '20px', fontSize: '18px', color: 'rgba(255, 255, 255, 0.7)' }}>×</button>
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
              style={{ width: '100%', height: '100%', minHeight: '120px', resize: 'none' }}
            />
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
