/**
 * Transcript window component with editing capabilities
 * Moved from src/components/TranscriptWindow.tsx
 */
import { useState, useEffect } from 'react';
import { Paper, Textarea, ActionIcon, Text, Loader, Group } from '@mantine/core';
import { AudioPlayback } from './AudioPlayback';
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
    <Paper
      className="transcript-window"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: zIndex.modal,
        width: '500px',
        height: '400px',
        resize: 'both',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Group justify="space-between" align="center" p="md" style={{ 
        borderBottom: `1px solid ${colors.muted}20`,
        flexShrink: 0
      }}>
        <Text 
          size="sm" 
          fw={600} 
          tt="uppercase" 
          style={{ letterSpacing: '0.5px', color: colors.primary }}
        >
          Transcription
        </Text>
        <ActionIcon 
          variant="subtle" 
          onClick={onClose}
          size="sm"
          style={{ color: colors.secondary }}
        >
          ×
        </ActionIcon>
      </Group>
      
      {/* Audio Playback */}
      {!isProcessing && audioData && (
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.muted}20`, flexShrink: 0 }}>
          <AudioPlayback
            audioData={audioData}
            duration={recordingDuration}
          />
        </div>
      )}
      
      {/* Content Area */}
      <div style={{ flex: 1, padding: '16px', overflow: 'hidden' }}>
        {isProcessing ? (
          <Group gap="xs" align="center" style={{ 
            justifyContent: 'center', 
            height: '100%',
            flexDirection: 'column'
          }}>
            <Loader size="md" />
            <Text size="sm" style={{ color: colors.secondary }}>Processing audio...</Text>
          </Group>
        ) : (
          <Textarea
            value={editableText}
            onChange={(e) => setEditableText(e.currentTarget.value)}
            placeholder="Your transcription will appear here..."
            style={{ 
              fontSize: typography.fontSize.base,
              height: '100%',
              resize: 'none'
            }}
            styles={{
              input: {
                height: '100%',
                minHeight: 'unset'
              }
            }}
          />
        )}
      </div>
    </Paper>
  );
}
