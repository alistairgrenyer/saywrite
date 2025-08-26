import './TranscriptWindow.css';

interface TranscriptWindowProps {
  text: string;
  isProcessing?: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}

export function TranscriptWindow({ text, isProcessing = false, position, onClose }: TranscriptWindowProps) {
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
            text
          )}
        </div>
      </div>
    </div>
  );
}
