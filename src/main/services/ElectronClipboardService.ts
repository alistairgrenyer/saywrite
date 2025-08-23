import { clipboard } from 'electron';
import { injectable } from 'inversify';
import { ClipboardService } from '../../core/ports/ClipboardService';

/**
 * Implementation of ClipboardService using Electron's clipboard API
 */
@injectable()
export class ElectronClipboardService implements ClipboardService {
  private savedClipboardText: string | null = null;

  /**
   * Get text from clipboard
   * @returns The clipboard text
   */
  getText(): string {
    return clipboard.readText();
  }

  /**
   * Set text to clipboard
   * @param text The text to set
   */
  setText(text: string): void {
    clipboard.writeText(text);
  }

  /**
   * Save current clipboard content
   * @returns A token to identify this saved clipboard state
   */
  saveClipboard(): string {
    this.savedClipboardText = clipboard.readText();
    return Date.now().toString(); // Simple token based on timestamp
  }

  /**
   * Restore clipboard from saved state
   * @param token The token returned from saveClipboard
   * @returns True if restore was successful
   */
  restoreClipboard(token: string): boolean {
    if (this.savedClipboardText !== null) {
      clipboard.writeText(this.savedClipboardText);
      this.savedClipboardText = null;
      return true;
    }
    return false;
  }

  /**
   * Clear saved clipboard state
   */
  clearSavedClipboard(): void {
    this.savedClipboardText = null;
  }
}
