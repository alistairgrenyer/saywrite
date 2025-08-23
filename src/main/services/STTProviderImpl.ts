import { injectable, inject } from 'inversify';
import { STTProvider, TranscriptionResult } from '../../core/ports/STTProvider';
import { ApiClient } from '../../core/ports/ApiClient';
import { TYPES } from '../../di/symbols';

/**
 * Implementation of STTProvider using the ApiClient
 */
@injectable()
export class STTProviderImpl implements STTProvider {
  constructor(
    @inject(TYPES.ApiClient) private apiClient: ApiClient
  ) {}

  /**
   * Transcribe audio data to text
   * @param audioData The audio data as Buffer or base64 string
   * @param format The audio format (e.g., 'wav', 'mp3')
   * @param language Optional language code (default: 'en')
   * @returns Promise resolving to transcription result
   */
  async transcribe(audioData: Buffer | string, format: string, language?: string): Promise<TranscriptionResult> {
    const response = await this.apiClient.transcribe({
      audio: audioData,
      audioFormat: format,
      language: language || 'en',
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error?.message || 'Transcription failed',
      };
    }

    return {
      success: true,
      text: response.data.text,
      language: response.data.language,
      confidence: response.data.confidence,
    };
  }
}
