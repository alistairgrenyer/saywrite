/**
 * Interface for clipboard operations
 */
export interface ClipboardService {
  /**
   * Get text from clipboard
   * @returns The clipboard text
   */
  getText(): string;
  
  /**
   * Set text to clipboard
   * @param text The text to set
   */
  setText(text: string): void;
  
  /**
   * Save current clipboard content
   * @returns A token to identify this saved clipboard state
   */
  saveClipboard(): string;
  
  /**
   * Restore clipboard from saved state
   * @param token The token returned from saveClipboard
   * @returns True if restore was successful
   */
  restoreClipboard(token: string): boolean;
  
  /**
   * Clear saved clipboard state
   */
  clearSavedClipboard(): void;
}
