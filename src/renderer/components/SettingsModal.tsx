import React, { useState, useEffect } from 'react';
import { AppSettings, AppMode } from '../../core/ports/SettingsStore';
import '../styles/SettingsModal.css';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<AppSettings>({
    mode: 'self-hosted',
    apiBaseUrl: 'http://127.0.0.1:5175',
    hostedApiBaseUrl: 'https://api.myapp.com',
    hostedTokenExists: false,
  });
  
  const [newToken, setNewToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const currentSettings = await window.electronAPI.getSettings();
        setSettings(currentSettings);
        
        // Check if token exists
        const tokenExists = await window.electronAPI.checkTokenExists();
        setSettings(prev => ({ ...prev, hostedTokenExists: tokenExists }));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Handle mode change
  const handleModeChange = (mode: AppMode) => {
    setSettings(prev => ({ ...prev, mode }));
  };

  // Handle URL change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>, isHosted: boolean) => {
    const url = e.target.value;
    if (isHosted) {
      setSettings(prev => ({ ...prev, hostedApiBaseUrl: url }));
    } else {
      setSettings(prev => ({ ...prev, apiBaseUrl: url }));
    }
  };

  // Handle token change
  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewToken(e.target.value);
  };

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    
    try {
      // Save mode
      await window.electronAPI.setMode({ mode: settings.mode });
      
      // Save API URLs
      await window.electronAPI.setApiUrl({ 
        url: settings.apiBaseUrl, 
        isHosted: false 
      });
      
      await window.electronAPI.setApiUrl({ 
        url: settings.hostedApiBaseUrl, 
        isHosted: true 
      });
      
      // Save token if provided
      if (newToken) {
        await window.electronAPI.setToken({ token: newToken });
        setSettings(prev => ({ ...prev, hostedTokenExists: true }));
        setNewToken('');
      }
      
      setSaveSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete token
  const handleDeleteToken = async () => {
    try {
      await window.electronAPI.deleteToken();
      setSettings(prev => ({ ...prev, hostedTokenExists: false }));
    } catch (error) {
      console.error('Failed to delete token:', error);
      setSaveError('Failed to delete token. Please try again.');
    }
  };

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        
        <div className="settings-content">
          <div className="settings-section">
            <h3>Mode</h3>
            <div className="mode-selector">
              <label>
                <input
                  type="radio"
                  name="mode"
                  value="self-hosted"
                  checked={settings.mode === 'self-hosted'}
                  onChange={() => handleModeChange('self-hosted')}
                />
                Self-host (local API)
              </label>
              
              <label>
                <input
                  type="radio"
                  name="mode"
                  value="hosted"
                  checked={settings.mode === 'hosted'}
                  onChange={() => handleModeChange('hosted')}
                />
                Hosted (remote API)
              </label>
            </div>
          </div>
          
          <div className="settings-section">
            <h3>API URLs</h3>
            <div className="url-inputs">
              <div className="input-group">
                <label>Local API URL:</label>
                <input
                  type="text"
                  value={settings.apiBaseUrl}
                  onChange={(e) => handleUrlChange(e, false)}
                  placeholder="http://127.0.0.1:5175"
                />
              </div>
              
              <div className="input-group">
                <label>Hosted API URL:</label>
                <input
                  type="text"
                  value={settings.hostedApiBaseUrl}
                  onChange={(e) => handleUrlChange(e, true)}
                  placeholder="https://api.myapp.com"
                />
              </div>
            </div>
          </div>
          
          <div className="settings-section">
            <h3>API Authentication</h3>
            {settings.hostedTokenExists ? (
              <div className="token-status">
                <p>✅ API token is set</p>
                <button onClick={handleDeleteToken} className="delete-token-button">
                  Delete Token
                </button>
              </div>
            ) : (
              <div className="input-group">
                <label>API Token:</label>
                <input
                  type="password"
                  value={newToken}
                  onChange={handleTokenChange}
                  placeholder="Enter your API token"
                />
              </div>
            )}
          </div>
          
          {saveError && <div className="error-message">{saveError}</div>}
          {saveSuccess && <div className="success-message">Settings saved successfully!</div>}
          
          <div className="settings-actions">
            <button 
              onClick={handleSave} 
              className="save-button"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
            <button onClick={onClose} className="cancel-button">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
