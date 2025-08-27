/**
 * Settings panel component
 */
import { useState } from 'react';
import { GlassPanel } from '@shared/components/GlassPanel';
import { AppSettings } from '../hooks/useSettings';
import '@/styles/shared.css';
import './SettingsPanel.css';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onClose: () => void;
  isVisible: boolean;
}

export function SettingsPanel({ settings, onUpdateSettings, onClose, isVisible }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'audio' | 'ui' | 'transcription'>('audio');

  if (!isVisible) return null;

  const tabs = [
    { id: 'audio' as const, label: 'Audio', icon: '🎤' },
    { id: 'ui' as const, label: 'Interface', icon: '🎨' },
    { id: 'transcription' as const, label: 'Transcription', icon: '📝' },
  ];

  const renderAudioSettings = () => (
    <div className="settings-section">
      <div className="setting-group">
        <label className="setting-label">Sample Rate</label>
        <select
          value={settings.audioSettings.sampleRate}
          onChange={(e) => onUpdateSettings({
            audioSettings: { ...settings.audioSettings, sampleRate: Number(e.target.value) }
          })}
          className="glass-select"
        >
          <option value={16000}>16 kHz</option>
          <option value={44100}>44.1 kHz</option>
          <option value={48000}>48 kHz</option>
        </select>
      </div>

      <div className="setting-group">
        <label className="setting-label">Buffer Size</label>
        <select
          value={settings.audioSettings.bufferSize}
          onChange={(e) => onUpdateSettings({
            audioSettings: { ...settings.audioSettings, bufferSize: Number(e.target.value) }
          })}
          className="glass-select"
        >
          <option value={1024}>1024</option>
          <option value={2048}>2048</option>
          <option value={4096}>4096</option>
        </select>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.audioSettings.echoCancellation}
            onChange={(e) => onUpdateSettings({
              audioSettings: { ...settings.audioSettings, echoCancellation: e.target.checked }
            })}
          />
          <span>Echo Cancellation</span>
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.audioSettings.noiseSuppression}
            onChange={(e) => onUpdateSettings({
              audioSettings: { ...settings.audioSettings, noiseSuppression: e.target.checked }
            })}
          />
          <span>Noise Suppression</span>
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.audioSettings.autoGainControl}
            onChange={(e) => onUpdateSettings({
              audioSettings: { ...settings.audioSettings, autoGainControl: e.target.checked }
            })}
          />
          <span>Auto Gain Control</span>
        </label>
      </div>
    </div>
  );

  const renderUISettings = () => (
    <div className="settings-section">
      <div className="setting-group">
        <label className="setting-label">Theme</label>
        <select
          value={settings.uiSettings.theme}
          onChange={(e) => onUpdateSettings({
            uiSettings: { ...settings.uiSettings, theme: e.target.value as 'dark' | 'light' | 'auto' }
          })}
          className="glass-select"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="auto">Auto</option>
        </select>
      </div>

      <div className="setting-group">
        <label className="setting-label">Window Opacity</label>
        <input
          type="range"
          min="0.5"
          max="1"
          step="0.05"
          value={settings.uiSettings.windowOpacity}
          onChange={(e) => onUpdateSettings({
            uiSettings: { ...settings.uiSettings, windowOpacity: Number(e.target.value) }
          })}
          className="glass-slider"
        />
        <span className="setting-value">{Math.round(settings.uiSettings.windowOpacity * 100)}%</span>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.uiSettings.alwaysOnTop}
            onChange={(e) => onUpdateSettings({
              uiSettings: { ...settings.uiSettings, alwaysOnTop: e.target.checked }
            })}
          />
          <span>Always on Top</span>
        </label>
      </div>
    </div>
  );

  const renderTranscriptionSettings = () => (
    <div className="settings-section">
      <div className="setting-group">
        <label className="setting-label">Language</label>
        <select
          value={settings.transcriptionSettings.language}
          onChange={(e) => onUpdateSettings({
            transcriptionSettings: { ...settings.transcriptionSettings, language: e.target.value }
          })}
          className="glass-select"
        >
          <option value="en-US">English (US)</option>
          <option value="en-GB">English (UK)</option>
          <option value="es-ES">Spanish</option>
          <option value="fr-FR">French</option>
          <option value="de-DE">German</option>
        </select>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.transcriptionSettings.autoSave}
            onChange={(e) => onUpdateSettings({
              transcriptionSettings: { ...settings.transcriptionSettings, autoSave: e.target.checked }
            })}
          />
          <span>Auto Save Transcripts</span>
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.transcriptionSettings.showTimestamps}
            onChange={(e) => onUpdateSettings({
              transcriptionSettings: { ...settings.transcriptionSettings, showTimestamps: e.target.checked }
            })}
          />
          <span>Show Timestamps</span>
        </label>
      </div>
    </div>
  );

  return (
    <GlassPanel
      className="settings-panel"
      animate={true}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1001,
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '80vh'
      }}
    >
      <div className="settings-content">
        <div className="settings-header">
          <span className="text-primary">Settings</span>
          <button className="glass-button" onClick={onClose}>×</button>
        </div>

        <div className="settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-body">
          {activeTab === 'audio' && renderAudioSettings()}
          {activeTab === 'ui' && renderUISettings()}
          {activeTab === 'transcription' && renderTranscriptionSettings()}
        </div>
      </div>
    </GlassPanel>
  );
}
