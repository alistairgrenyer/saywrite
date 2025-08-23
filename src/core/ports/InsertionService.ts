/**
 * Options for text insertion
 */
export interface InsertionOptions {
  /**
   * Whether to use paste method (true) or typing (false)
   */
  usePaste?: boolean;
  
  /**
   * Typing speed in milliseconds per character (for typing method)
   */
  typingSpeed?: number;
}

/**
 * Interface for text insertion operations
 */
export interface InsertionService {
  /**
   * Insert text at current cursor position
   * @param text The text to insert
   * @param options Optional insertion options
   * @returns Promise resolving to true if successful
   */
  insertText(text: string, options?: InsertionOptions): Promise<boolean>;
  
  /**
   * Type text character by character
   * @param text The text to type
   * @param speed Milliseconds between keystrokes
   * @returns Promise resolving to true if successful
   */
  typeText(text: string, speed?: number): Promise<boolean>;
  
  /**
   * Paste text at current cursor position
   * @param text The text to paste
   * @returns Promise resolving to true if successful
   */
  pasteText(text: string): Promise<boolean>;
}
