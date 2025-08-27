/**
 * Error display component for showing user-friendly error messages
 */
import { AppError, Position } from '@shared/lib/types';
import { useRelativePosition } from '@shared/hooks/useRelativePosition';
import { zIndex } from '@shared/lib/design-tokens';
import '@/styles/shared.css';
import './ErrorDisplay.css';

interface ErrorDisplayProps {
  error: AppError;
  bubblePosition: Position;
  onClose: () => void;
  onRetry?: () => void;
}

export function ErrorDisplay({ error, bubblePosition, onClose, onRetry }: ErrorDisplayProps) {
  // Use relative positioning based on bubble position
  const { position } = useRelativePosition({
    parentPosition: bubblePosition,
    componentType: 'error',
    elementSize: { 
      width: 300, 
      height: 150 
    },
  });
  const getErrorIcon = () => {
    switch (error.type) {
      case 'audio':
        return '🎤';
      case 'stt':
        return '📝';
      default:
        return '⚠️';
    }
  };

  return (
    <div 
      className="error-display"
      style={{
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        zIndex: zIndex.toast
      }}
    >
      <div className="error-content">
        <div className="error-icon">{getErrorIcon()}</div>
        <span className="error-message">{error.message}</span>
        <div className="error-actions">
          {onRetry && (
            <button onClick={onRetry} className="error-retry">
              Retry
            </button>
          )}
          <button onClick={onClose} className="error-close">×</button>
        </div>
      </div>
    </div>
  );
}
