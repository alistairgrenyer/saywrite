import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Add global type definitions for the exposed Electron API
declare global {
  interface Window {
    electronAPI: {
      // Settings
      getSettings: () => Promise<any>;
      setMode: (modeData: { mode: 'self-hosted' | 'hosted' }) => Promise<boolean>;
      setApiUrl: (urlData: { url: string; isHosted: boolean }) => Promise<any>;
      
      // Token management
      setToken: (tokenData: { token: string }) => Promise<boolean>;
      checkTokenExists: () => Promise<boolean>;
      deleteToken: () => Promise<boolean>;
      
      // Hotkeys
      registerHotkey: (hotkeyData: { key: string; modifiers: string[]; action: string }) => Promise<boolean>;
      onHotkeyTriggered: (callback: (data: { action: string }) => void) => () => void;
      
      // Clipboard
      getClipboardText: () => Promise<string>;
      setClipboardText: (text: string) => Promise<boolean>;
      saveClipboard: () => Promise<string>;
      restoreClipboard: (token: string) => Promise<boolean>;
      
      // Text insertion
      insertText: (text?: string) => Promise<boolean>;
      retryInsertion: () => Promise<boolean>;
    };
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
