import { injectable } from 'inversify';
import { keyboard, Key } from '@nut-tree/nut-js';
import { InsertionOptions, InsertionService } from '../../core/ports/InsertionService';

/**
 * Implementation of InsertionService using nut-js for keyboard automation
 */
@injectable()
export class NutJsInsertionService implements InsertionService {
  private defaultTypingSpeed = 50; // ms between keystrokes
  
  constructor() {
    // Configure nut-js
    keyboard.config.autoDelayMs = this.defaultTypingSpeed;
  }

  /**
   * Insert text at current cursor position
   * @param text The text to insert
   * @param options Optional insertion options
   * @returns Promise resolving to true if successful
   */
  async insertText(text: string, options?: InsertionOptions): Promise<boolean> {
    try {
      if (options?.usePaste !== false) {
        // Default to paste method
        return this.pasteText(text);
      } else {
        // Use typing method
        return this.typeText(text, options?.typingSpeed);
      }
    } catch (error) {
      console.error('Error inserting text:', error);
      return false;
    }
  }

  /**
   * Type text character by character
   * @param text The text to type
   * @param speed Milliseconds between keystrokes
   * @returns Promise resolving to true if successful
   */
  async typeText(text: string, speed?: number): Promise<boolean> {
    try {
      // Set typing speed if provided
      if (speed && speed !== keyboard.config.autoDelayMs) {
        const originalSpeed = keyboard.config.autoDelayMs;
        keyboard.config.autoDelayMs = speed;
        
        // Type the text
        await keyboard.type(text);
        
        // Restore original speed
        keyboard.config.autoDelayMs = originalSpeed;
      } else {
        // Type with default speed
        await keyboard.type(text);
      }
      
      return true;
    } catch (error) {
      console.error('Error typing text:', error);
      return false;
    }
  }
  
  /**
   * Paste text at current cursor position
   * @param text The text to paste
   * @returns Promise resolving to true if successful
   */
  async pasteText(text: string): Promise<boolean> {
    try {
      // Simulate Ctrl+V to paste
      await keyboard.pressKey(Key.LeftControl);
      await keyboard.pressKey(Key.V);
      await keyboard.releaseKey(Key.V);
      await keyboard.releaseKey(Key.LeftControl);
      
      return true;
    } catch (error) {
      console.error('Error pasting text:', error);
      return false;
    }
  }
}
