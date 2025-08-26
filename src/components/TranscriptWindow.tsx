import './TranscriptWindow.css';

interface TranscriptWindowProps {
  text: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export function TranscriptWindow({ text, position, onClose }: TranscriptWindowProps) {
  if (!text) return null;

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
        <div className="transcript-text">{text}</div>
      </div>
    </div>
  );
}
