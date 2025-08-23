import { globalShortcut, BrowserWindow } from 'electron';
import { injectable, inject } from 'inversify';
import { HotkeyService } from '../../core/ports/HotkeyService';
import { TYPES } from '../../di/symbols';

@injectable()
export class ElectronHotkeyService implements HotkeyService {
  private registeredHotkeys: Map<string, () => void> = new Map();
  private mainWindow: BrowserWindow;

  constructor(
    @inject(TYPES.MainWindow) mainWindow: BrowserWindow
  ) {
    this.mainWindow = mainWindow;
  }

  /**
   * Registers a global hotkey
   * @param key The key to register (e.g., 'A', 'F1')
   * @param modifiers Array of modifiers (e.g., ['Ctrl', 'Shift'])
   * @param callback Function to execute when hotkey is triggered
   * @returns True if registration was successful
   */
  registerHotkey(key: string, modifiers: string[], callback: () => void): boolean {
    const accelerator = this.buildAccelerator(key, modifiers);
    
    // Unregister if already exists
    if (this.registeredHotkeys.has(accelerator)) {
      globalShortcut.unregister(accelerator);
      this.registeredHotkeys.delete(accelerator);
    }

    try {
      const success = globalShortcut.register(accelerator, () => {
        // Execute callback and focus window if needed
        if (!this.mainWindow.isFocused()) {
          this.mainWindow.show();
        }
        callback();
      });

      if (success) {
        this.registeredHotkeys.set(accelerator, callback);
      }

      return success;
    } catch (error) {
      console.error(`Failed to register hotkey ${accelerator}:`, error);
      return false;
    }
  }

  /**
   * Unregisters a global hotkey
   * @param key The key to unregister
   * @param modifiers Array of modifiers
   * @returns True if unregistration was successful
   */
  unregisterHotkey(key: string, modifiers: string[]): boolean {
    const accelerator = this.buildAccelerator(key, modifiers);
    
    if (this.registeredHotkeys.has(accelerator)) {
      try {
        globalShortcut.unregister(accelerator);
        this.registeredHotkeys.delete(accelerator);
        return true;
      } catch (error) {
        console.error(`Failed to unregister hotkey ${accelerator}:`, error);
        return false;
      }
    }
    
    return false;
  }

  /**
   * Unregisters all global hotkeys
   */
  unregisterAllHotkeys(): void {
    try {
      globalShortcut.unregisterAll();
      this.registeredHotkeys.clear();
    } catch (error) {
      console.error('Failed to unregister all hotkeys:', error);
    }
  }

  /**
   * Checks if a hotkey is registered
   * @param key The key to check
   * @param modifiers Array of modifiers
   * @returns True if the hotkey is registered
   */
  isRegistered(key: string, modifiers: string[]): boolean {
    const accelerator = this.buildAccelerator(key, modifiers);
    return globalShortcut.isRegistered(accelerator);
  }

  /**
   * Builds an Electron accelerator string from key and modifiers
   * @param key The key (e.g., 'A', 'F1')
   * @param modifiers Array of modifiers (e.g., ['Ctrl', 'Shift'])
   * @returns Accelerator string (e.g., 'Ctrl+Shift+A')
   */
  private buildAccelerator(key: string, modifiers: string[]): string {
    // Map our modifiers to Electron's format
    const mappedModifiers = modifiers.map(modifier => {
      switch (modifier.toLowerCase()) {
        case 'ctrl':
        case 'control':
          return 'CommandOrControl';
        case 'alt':
          return 'Alt';
        case 'shift':
          return 'Shift';
        case 'super':
        case 'meta':
        case 'cmd':
        case 'command':
          return 'Super';
        default:
          return modifier;
      }
    });

    // Join modifiers with '+' and add key
    return [...mappedModifiers, key].join('+');
  }
}
