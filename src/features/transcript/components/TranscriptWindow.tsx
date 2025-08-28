/**
 * Transcript window component with editing capabilities
 * Moved from src/components/TranscriptWindow.tsx
 */
import { useState, useEffect } from 'react';
import { Paper, Group, Text, Textarea, ActionIcon, Loader } from '@mantine/core';
import { AudioPlayback } from './AudioPlayback';
import { components, zIndex, colors, typography } from '@shared/lib/design-tokens';
import { useComponentPosition } from '@shared/layout/useComponentPosition';
import { Position } from '@shared/layout/positioning';
import '@/styles/shared.css';
import './TranscriptWindow.css';

interface TranscriptWindowProps {
  text: string;
  isProcessing?: boolean;
  onClose: () => void;
  audioData?: ArrayBuffer;
  recordingDuration?: number;
  bubblePosition: Position;
}

export function TranscriptWindow({ 
  text, 
  isProcessing = false, 
  onClose, 
  audioData, 
  recordingDuration = 0,
  bubblePosition 
}: TranscriptWindowProps) {
  const [editableText, setEditableText] = useState(text);

  // Use simplified positioning system
  const position = useComponentPosition({
    bubblePosition,
    componentSize: components.transcript.size,
    config: components.transcript.positioning,
    isVisible: !!(text || isProcessing),
  });

  useEffect(() => {
    setEditableText(text);
  }, [text]);

  if (!text && !isProcessing) return null;
  if (!position) return null; // Don't render until we have a position

  return (
    <Paper
      className="transcript-window"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: zIndex.transcript,
        width: `${components.transcript.size.width}px`,
        height: `${components.transcript.size.height}px`,
        minWidth: `${components.transcript.minSize?.width}px`,
        minHeight: `${components.transcript.minSize?.height}px`,
        maxWidth: `${components.transcript.maxSize?.width}px`,
        maxHeight: `${components.transcript.maxSize?.height}px`,
        ...components.transcript.styles,
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
      <div style={{ flex: 1, padding: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '150px' }}>
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
            autosize
            minRows={4}
            maxRows={20}
            style={{ 
              fontSize: typography.fontSize.base,
              flex: 1
            }}
            styles={{
              input: {
                resize: 'none'
              }
            }}
          />
        )}
      </div>
    </Paper>
  );
}
