import { contextBridge, ipcRenderer } from 'electron';
import { z } from 'zod';

// Validation schemas for IPC payloads
const HotkeySchema = z.object({
  key: z.string(),
  modifiers: z.array(z.string()),
  action: z.string(),
});

const ModeSchema = z.object({
  mode: z.enum(['self-hosted', 'hosted']),
});

const ApiUrlSchema = z.object({
  url: z.string().url(),
  isHosted: z.boolean(),
});

const TokenSchema = z.object({
  token: z.string().min(1),
});

// Expose validated IPC APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  
  setMode: (modeData: unknown) => {
    try {
      const validatedData = ModeSchema.parse(modeData);
      return ipcRenderer.invoke('set-mode', validatedData);
    } catch (error) {
      console.error('Invalid mode data:', error);
      return Promise.resolve(false);
    }
  },
  
  setApiUrl: (urlData: unknown) => {
    try {
      const validatedData = ApiUrlSchema.parse(urlData);
      return ipcRenderer.invoke('set-api-url', validatedData);
    } catch (error) {
      console.error('Invalid URL data:', error);
      return Promise.resolve(false);
    }
  },
  
  // Token management
  setToken: (tokenData: unknown) => {
    try {
      const validatedData = TokenSchema.parse(tokenData);
      return ipcRenderer.invoke('set-token', validatedData);
    } catch (error) {
      console.error('Invalid token data:', error);
      return Promise.resolve(false);
    }
  },
  
  checkTokenExists: () => ipcRenderer.invoke('check-token-exists'),
  deleteToken: () => ipcRenderer.invoke('delete-token'),
  
  // Hotkeys
  registerHotkey: (hotkeyData: unknown) => {
    try {
      const validatedData = HotkeySchema.parse(hotkeyData);
      return ipcRenderer.invoke('register-hotkey', validatedData);
    } catch (error) {
      console.error('Invalid hotkey data:', error);
      return Promise.resolve(false);
    }
  },
  
  onHotkeyTriggered: (callback: (data: { action: string }) => void) => {
    const listener = (_: any, data: { action: string }) => callback(data);
    ipcRenderer.on('hotkey-triggered', listener);
    return () => {
      ipcRenderer.removeListener('hotkey-triggered', listener);
    };
  },
  
  // Clipboard
  getClipboardText: () => ipcRenderer.invoke('get-clipboard-text'),
  setClipboardText: (text: string) => ipcRenderer.invoke('set-clipboard-text', text),
  saveClipboard: () => ipcRenderer.invoke('save-clipboard'),
  restoreClipboard: (token: string) => ipcRenderer.invoke('restore-clipboard', token),
  
  // Text insertion
  insertText: (text: string) => ipcRenderer.invoke('insert-text', text),
  retryInsertion: () => ipcRenderer.invoke('retry-insertion'),
});

// TypeScript interface for the exposed API
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
