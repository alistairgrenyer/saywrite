/**
 * Error display component for showing user-friendly error messages
 */
import React from 'react';
import { AppError, Position } from '@shared/lib/types';
import '@/styles/shared.css';
import './ErrorDisplay.css';

interface ErrorDisplayProps {
  error: AppError;
  position: Position;
  onClose: () => void;
  onRetry?: () => void;
}

export function ErrorDisplay({ error, position, onClose, onRetry }: ErrorDisplayProps) {
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
        zIndex: 1002
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
