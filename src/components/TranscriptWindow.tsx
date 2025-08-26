import { useState, useEffect } from 'react';
import { AudioPlayback } from './AudioPlayback';
import './TranscriptWindow.css';

interface TranscriptWindowProps {
  text: string;
  isProcessing?: boolean;
  position: { x: number; y: number };
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
    <div 
      className="transcript-window"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000
      }}
    >
      <div className="transcript-content">
        <div className="transcript-header">
          <span className="transcript-title">Transcription</span>
          <button className="transcript-close" onClick={onClose}>×</button>
        </div>
        
        {!isProcessing && audioData && (
          <AudioPlayback
            audioData={audioData}
            duration={recordingDuration}
            onClose={() => {}}
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
              className="editable-transcript"
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              placeholder="Your transcription will appear here..."
              rows={6}
            />
          )}
        </div>
      </div>
    </div>
  );
}
