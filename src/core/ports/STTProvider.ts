/**
 * Transcription result interface
 */
export interface TranscriptionResult {
  success: boolean;
  text?: string;
  language?: string;
  confidence?: number;
  error?: string;
}

/**
 * Interface for Speech-to-Text providers
 */
export interface STTProvider {
  /**
   * Transcribe audio data to text
   * @param audioData The audio data as Buffer or base64 string
   * @param format The audio format (e.g., 'wav', 'mp3')
   * @param language Optional language code (default: 'en')
   * @returns Promise resolving to transcription result
   */
  transcribe(audioData: Buffer | string, format: string, language?: string): Promise<TranscriptionResult>;
}
