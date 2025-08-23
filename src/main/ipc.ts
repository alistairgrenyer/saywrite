import { BrowserWindow, ipcMain } from 'electron';
import { Container } from 'inversify';
import { z } from 'zod';
import keytar from 'keytar';
import { TYPES } from '../di/symbols';
import { SettingsStore, AppMode } from '../core/ports/SettingsStore';
import { HotkeyService } from '../core/ports/HotkeyService';
import { ClipboardService } from '../core/ports/ClipboardService';
import { InsertionService } from '../core/ports/InsertionService';

// Service name for keytar
const SERVICE_NAME = 'SayWrite';
const ACCOUNT_NAME = 'hosted-api';

// Validation schemas for IPC payloads
const SetHotkeySchema = z.object({
  accelerator: z.string(),
  action: z.enum(['record', 'insert', 'cancel']),
});

const SetModeSchema = z.object({
  mode: z.enum(['self-host', 'hosted']),
});

const SetApiUrlSchema = z.object({
  url: z.string().url(),
  isHosted: z.boolean(),
});

const SetTokenSchema = z.object({
  token: z.string().min(1),
});

/**
 * Set up IPC handlers for the main process
 * @param mainWindow The main BrowserWindow instance
 * @param container The DI container
 */
export function setupIPC(mainWindow: BrowserWindow, container: Container) {
  const settingsStore = container.get<SettingsStore>(TYPES.SettingsStore);
  const hotkeyService = container.get<HotkeyService>(TYPES.HotkeyService);
  const clipboardService = container.get<ClipboardService>(TYPES.ClipboardService);
  const insertionService = container.get<InsertionService>(TYPES.InsertionService);

  // Settings-related IPC handlers
  ipcMain.handle('get-settings', async () => {
    return await settingsStore.getSettings();
  });

  ipcMain.handle('set-mode', async (_, modeData) => {
    try {
      const { mode } = SetModeSchema.parse(modeData);
      return await settingsStore.setMode(mode as AppMode);
    } catch (error) {
      console.error('Invalid mode data:', error);
      return false;
    }
  });

  ipcMain.handle('set-api-url', async (_, urlData) => {
    try {
      const { url, isHosted } = SetApiUrlSchema.parse(urlData);
      const settings = isHosted 
        ? { hostedApiBaseUrl: url } 
        : { apiBaseUrl: url };
      return await settingsStore.updateSettings(settings);
    } catch (error) {
      console.error('Invalid URL data:', error);
      return false;
    }
  });

  // Token management with keytar
  ipcMain.handle('set-token', async (_, tokenData) => {
    try {
      const { token } = SetTokenSchema.parse(tokenData);
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);
      await settingsStore.updateSettings({ hostedTokenExists: true });
      return true;
    } catch (error) {
      console.error('Error setting token:', error);
      return false;
    }
  });

  ipcMain.handle('check-token-exists', async () => {
    try {
      const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
      return !!token;
    } catch (error) {
      console.error('Error checking token:', error);
      return false;
    }
  });

  ipcMain.handle('delete-token', async () => {
    try {
      await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
      await settingsStore.updateSettings({ hostedTokenExists: false });
      return true;
    } catch (error) {
      console.error('Error deleting token:', error);
      return false;
    }
  });

  // Hotkey management
  ipcMain.handle('register-hotkey', async (_, hotkeyData) => {
    try {
      const { accelerator, action } = SetHotkeySchema.parse(hotkeyData);
      
      // Unregister any existing hotkey for this action
      hotkeyService.unregister(accelerator);
      
      // Register the new hotkey
      return hotkeyService.register(accelerator, () => {
        // Send event to renderer when hotkey is pressed
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('hotkey-triggered', { action });
        }
      });
    } catch (error) {
      console.error('Invalid hotkey data:', error);
      return false;
    }
  });

  // Clipboard operations
  ipcMain.handle('get-clipboard-text', () => {
    return clipboardService.getText();
  });

  ipcMain.handle('set-clipboard-text', (_, text: string) => {
    clipboardService.setText(text);
    return true;
  });

  ipcMain.handle('save-clipboard', () => {
    return clipboardService.saveClipboard();
  });

  ipcMain.handle('restore-clipboard', (_, token: string) => {
    clipboardService.restoreClipboard(token);
    return true;
  });

  // Text insertion
  ipcMain.handle('insert-text', async (_, text: string) => {
    return await insertionService.insertText(text);
  });

  ipcMain.handle('retry-insertion', async () => {
    return await insertionService.retryInsertion();
  });
}
