/**
 * Hook for managing application settings
 */
import { useState, useCallback, useEffect } from 'react';

export interface AppSettings {
  audioSettings: {
    sampleRate: number;
    channels: number;
    bufferSize: number;
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
  };
  uiSettings: {
    theme: 'dark' | 'light' | 'auto';
    bubblePosition: { x: number; y: number };
    windowOpacity: number;
    alwaysOnTop: boolean;
  };
  transcriptionSettings: {
    language: string;
    autoSave: boolean;
    showTimestamps: boolean;
  };
}

const defaultSettings: AppSettings = {
  audioSettings: {
    sampleRate: 16000,
    channels: 1,
    bufferSize: 2048,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  uiSettings: {
    theme: 'dark',
    bubblePosition: { x: 100, y: 100 },
    windowOpacity: 0.95,
    alwaysOnTop: false,
  },
  transcriptionSettings: {
    language: 'en-US',
    autoSave: false,
    showTimestamps: false,
  },
};

export interface UseSettingsReturn {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  saveSettings: () => void;
  loadSettings: () => void;
}

export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
      audioSettings: { ...prev.audioSettings, ...newSettings.audioSettings },
      uiSettings: { ...prev.uiSettings, ...newSettings.uiSettings },
      transcriptionSettings: { ...prev.transcriptionSettings, ...newSettings.transcriptionSettings },
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.removeItem('saywrite-settings');
  }, []);

  const saveSettings = useCallback(() => {
    try {
      localStorage.setItem('saywrite-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings]);

  const loadSettings = useCallback(() => {
    try {
      const saved = localStorage.getItem('saywrite-settings');
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        setSettings({
          ...defaultSettings,
          ...parsedSettings,
          audioSettings: { ...defaultSettings.audioSettings, ...parsedSettings.audioSettings },
          uiSettings: { ...defaultSettings.uiSettings, ...parsedSettings.uiSettings },
          transcriptionSettings: { ...defaultSettings.transcriptionSettings, ...parsedSettings.transcriptionSettings },
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  // Auto-save settings when they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveSettings();
    }, 500); // Debounce saves

    return () => clearTimeout(timeoutId);
  }, [settings, saveSettings]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    updateSettings,
    resetSettings,
    saveSettings,
    loadSettings,
  };
};
