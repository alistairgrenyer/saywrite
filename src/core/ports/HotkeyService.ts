/**
 * Interface for global hotkey operations
 */
export interface HotkeyService {
  /**
   * Register a global hotkey
   * @param accelerator The keyboard shortcut (e.g., 'CommandOrControl+Shift+P')
   * @param callback Function to call when the hotkey is pressed
   * @returns True if registration was successful
   */
  register(accelerator: string, callback: () => void): boolean;
  
  /**
   * Unregister a previously registered global hotkey
   * @param accelerator The keyboard shortcut to unregister
   * @returns True if unregistration was successful
   */
  unregister(accelerator: string): boolean;
  
  /**
   * Unregister all previously registered global hotkeys
   */
  unregisterAll(): void;
  
  /**
   * Check if a hotkey is registered
   * @param accelerator The keyboard shortcut to check
   * @returns True if the hotkey is registered
   */
  isRegistered(accelerator: string): boolean;
}
