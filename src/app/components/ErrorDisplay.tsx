/**
 * Error display component for showing user-friendly error messages
 */
import { AppError } from '@shared/lib/types';
import { useComponentPosition } from '@shared/layout/useComponentPosition';
import { Position } from '@shared/layout/positioning';
import { zIndex, components } from '@shared/lib/design-tokens';
import '@/styles/shared.css';
import './ErrorDisplay.css';

interface ErrorDisplayProps {
  error: AppError;
  onClose: () => void;
  onRetry?: () => void;
  bubblePosition: Position;
}

export function ErrorDisplay({ error, onClose, onRetry, bubblePosition }: ErrorDisplayProps) {
  // Use simplified positioning system
  const position = useComponentPosition({
    bubblePosition,
    componentSize: components.error.size,
    config: components.error.positioning,
    isVisible: true,
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

  if (!position) return null; // Don't render until we have a position

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
