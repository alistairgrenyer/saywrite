/**
 * Rewrite panel component for text enhancement
 */
import { useState } from 'react';
import { GlassPanel } from '@shared/components/GlassPanel';
import '@/styles/shared.css';
import './RewritePanel.css';

interface RewritePanelProps {
  text: string;
  onRewrite: (newText: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

export function RewritePanel({ text, onRewrite, onClose, isVisible }: RewritePanelProps) {
  const [selectedStyle, setSelectedStyle] = useState('improve');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isVisible) return null;

  const rewriteStyles = [
    { id: 'improve', label: 'Improve', description: 'Enhance clarity and readability' },
    { id: 'formal', label: 'Formal', description: 'Professional tone' },
    { id: 'casual', label: 'Casual', description: 'Conversational tone' },
    { id: 'concise', label: 'Concise', description: 'Shorter and direct' },
    { id: 'detailed', label: 'Detailed', description: 'More comprehensive' }
  ];

  const handleRewrite = async () => {
    setIsProcessing(true);
    // Placeholder for rewrite functionality
    setTimeout(() => {
      setIsProcessing(false);
      // For now, just return the original text
      onRewrite(text);
    }, 1500);
  };

  return (
    <GlassPanel className="rewrite-panel" animate={true}>
      <div className="rewrite-content">
        <div className="rewrite-header">
          <span className="text-primary">Rewrite Text</span>
          <button className="glass-button" onClick={onClose}>×</button>
        </div>

        <div className="rewrite-styles">
          <label className="style-label">Style:</label>
          <div className="style-options">
            {rewriteStyles.map((style) => (
              <button
                key={style.id}
                className={`style-button ${selectedStyle === style.id ? 'active' : ''}`}
                onClick={() => setSelectedStyle(style.id)}
                title={style.description}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rewrite-actions">
          <button
            className="glass-button primary"
            onClick={handleRewrite}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Rewrite'}
          </button>
        </div>

        <div className="rewrite-note">
          <small>AI-powered rewriting coming soon. Currently returns original text.</small>
        </div>
      </div>
    </GlassPanel>
  );
}
