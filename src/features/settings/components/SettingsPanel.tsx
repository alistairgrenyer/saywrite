/**
 * Settings panel component
 */
import { useState } from 'react';
import { Paper, Tabs, Select, Checkbox, Slider, ActionIcon, Text, Stack, Group } from '@mantine/core';
import { AppSettings } from '../hooks/useSettings';
import { useComponentPosition } from '@shared/layout/useComponentPosition';
import { Position } from '@shared/layout/positioning';
import { zIndex, colors, components } from '@shared/lib/design-tokens';
import '@/styles/shared.css';
import './SettingsPanel.css';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onClose: () => void;
  isVisible: boolean;
  bubblePosition: Position;
}

export function SettingsPanel({ settings, onUpdateSettings, onClose, isVisible, bubblePosition }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'audio' | 'ui' | 'transcription'>('audio');

  // Use simplified positioning system
  const position = useComponentPosition({
    bubblePosition,
    componentSize: components.settings.size,
    config: components.settings.positioning,
    isVisible,
  });

  if (!isVisible) return null;
  if (!position) return null; // Don't render until we have a position

  const tabs = [
    { id: 'audio' as const, label: 'Audio', icon: '🎤' },
    { id: 'ui' as const, label: 'Interface', icon: '🎨' },
    { id: 'transcription' as const, label: 'Transcription', icon: '📝' },
  ];

  const renderAudioSettings = () => (
    <Stack gap="md">
      <Select
        label="Sample Rate"
        value={settings.audioSettings.sampleRate.toString()}
        onChange={(value) => onUpdateSettings({
          audioSettings: { ...settings.audioSettings, sampleRate: Number(value) }
        })}
        data={[
          { value: '16000', label: '16 kHz' },
          { value: '44100', label: '44.1 kHz' },
          { value: '48000', label: '48 kHz' },
        ]}
      />

      <Select
        label="Buffer Size"
        value={settings.audioSettings.bufferSize.toString()}
        onChange={(value) => onUpdateSettings({
          audioSettings: { ...settings.audioSettings, bufferSize: Number(value) }
        })}
        data={[
          { value: '1024', label: '1024' },
          { value: '2048', label: '2048' },
          { value: '4096', label: '4096' },
        ]}
      />

      <Checkbox
        label="Echo Cancellation"
        checked={settings.audioSettings.echoCancellation}
        onChange={(e) => onUpdateSettings({
          audioSettings: { ...settings.audioSettings, echoCancellation: e.currentTarget.checked }
        })}
      />

      <Checkbox
        label="Noise Suppression"
        checked={settings.audioSettings.noiseSuppression}
        onChange={(e) => onUpdateSettings({
          audioSettings: { ...settings.audioSettings, noiseSuppression: e.currentTarget.checked }
        })}
      />

      <Checkbox
        label="Auto Gain Control"
        checked={settings.audioSettings.autoGainControl}
        onChange={(e) => onUpdateSettings({
          audioSettings: { ...settings.audioSettings, autoGainControl: e.currentTarget.checked }
        })}
      />
    </Stack>
  );

  const renderUISettings = () => (
    <Stack gap="md">
      <Select
        label="Theme"
        value={settings.uiSettings.theme}
        onChange={(value) => onUpdateSettings({
          uiSettings: { ...settings.uiSettings, theme: value as 'dark' | 'light' | 'auto' }
        })}
        data={[
          { value: 'dark', label: 'Dark' },
          { value: 'light', label: 'Light' },
          { value: 'auto', label: 'Auto' },
        ]}
      />

      <Stack gap="xs">
        <Text size="sm" style={{ color: colors.secondary }}>
          Window Opacity: {Math.round(settings.uiSettings.windowOpacity * 100)}%
        </Text>
        <Slider
          min={0.5}
          max={1}
          step={0.05}
          value={settings.uiSettings.windowOpacity}
          onChange={(value) => onUpdateSettings({
            uiSettings: { ...settings.uiSettings, windowOpacity: value }
          })}
          size="sm"
          style={{ width: '100%' }}
        />
      </Stack>

      <Checkbox
        label="Always on Top"
        checked={settings.uiSettings.alwaysOnTop}
        onChange={(e) => onUpdateSettings({
          uiSettings: { ...settings.uiSettings, alwaysOnTop: e.currentTarget.checked }
        })}
      />
    </Stack>
  );

  const renderTranscriptionSettings = () => (
    <Stack gap="md">
      <Select
        label="Language"
        value={settings.transcriptionSettings.language}
        onChange={(value) => onUpdateSettings({
          transcriptionSettings: { ...settings.transcriptionSettings, language: value || 'en-US' }
        })}
        data={[
          { value: 'en-US', label: 'English (US)' },
          { value: 'en-GB', label: 'English (UK)' },
          { value: 'es-ES', label: 'Spanish' },
          { value: 'fr-FR', label: 'French' },
          { value: 'de-DE', label: 'German' },
        ]}
      />

      <Checkbox
        label="Auto Save Transcripts"
        checked={settings.transcriptionSettings.autoSave}
        onChange={(e) => onUpdateSettings({
          transcriptionSettings: { ...settings.transcriptionSettings, autoSave: e.currentTarget.checked }
        })}
      />

      <Checkbox
        label="Show Timestamps"
        checked={settings.transcriptionSettings.showTimestamps}
        onChange={(e) => onUpdateSettings({
          transcriptionSettings: { ...settings.transcriptionSettings, showTimestamps: e.currentTarget.checked }
        })}
      />
    </Stack>
  );

  return (
    <Paper
      className="settings-panel"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: components.settings.size.width,
        minHeight: components.settings.minSize.height,
        maxHeight: components.settings.maxSize.height,
        background: components.settings.styles.background,
        backdropFilter: components.settings.styles.backdropFilter,
        border: components.settings.styles.border,
        borderRadius: components.settings.styles.borderRadius,
        boxShadow: components.settings.styles.boxShadow,
        zIndex: zIndex.settings,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack gap={0} style={{ height: '100%' }}>
        {/* Header */}
        <Group justify="space-between" align="center" p="md" style={{ borderBottom: `1px solid ${colors.muted}20` }}>
          <Text 
            size="lg" 
            fw={600} 
            style={{ color: colors.primary }}
          >
            Settings
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

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value as 'audio' | 'ui' | 'transcription')} orientation="horizontal" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Tabs.List grow px="md" pt="sm" style={{ flexShrink: 0 }}>
            {tabs.map((tab) => (
              <Tabs.Tab key={tab.id} value={tab.id} style={{ fontSize: '12px' }}>
                <Group gap="xs" align="center">
                  <span style={{ fontSize: '14px' }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </Group>
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {/* Content Area */}
          <div style={{ overflow: 'auto', flex: 1, minHeight: 0 }}>
            <Tabs.Panel value="audio" p="md">
              {renderAudioSettings()}
            </Tabs.Panel>

            <Tabs.Panel value="ui" p="md">
              {renderUISettings()}
            </Tabs.Panel>

            <Tabs.Panel value="transcription" p="md">
              {renderTranscriptionSettings()}
            </Tabs.Panel>
          </div>
        </Tabs>
      </Stack>
    </Paper>
  );
}
