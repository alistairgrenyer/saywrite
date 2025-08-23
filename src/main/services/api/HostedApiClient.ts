import { injectable, inject } from 'inversify';
import { ApiResponse, TranscriptionRequest, TranscriptionResponse, RewriteRequest, RewriteResponse } from '../../../core/ports/ApiClient';
import { BaseApiClient } from './BaseApiClient';
import { TYPES } from '../../../di/symbols';
import { SettingsStore } from '../../../core/ports/SettingsStore';

/**
 * Implementation of ApiClient for hosted/remote API
 */
@injectable()
export class HostedApiClient extends BaseApiClient {
  private tokenSet: boolean = false;

  constructor(
    @inject(TYPES.SettingsStore) private settingsStore: SettingsStore
  ) {
    // Get hosted API URL from settings
    const settings = settingsStore.getSettings();
    super(settings.hostedApiBaseUrl);
  }

  /**
   * Set the API token from secure storage
   * @param token The API token
   */
  setToken(token: string): void {
    this.setAuthToken(token);
    this.tokenSet = true;
  }

  /**
   * Check if token is set
   * @returns True if token is set
   */
  hasToken(): boolean {
    return this.tokenSet;
  }

  /**
   * Clear the API token
   */
  clearToken(): void {
    this.clearAuthToken();
    this.tokenSet = false;
  }

  /**
   * Transcribe audio to text using hosted API
   * @param request The transcription request
   * @returns Promise resolving to transcription response
   */
  async transcribe(request: TranscriptionRequest): Promise<ApiResponse<TranscriptionResponse>> {
    if (!this.tokenSet) {
      return {
        success: false,
        error: {
          code: 401,
          message: 'API token not set. Please configure your API token in settings.',
        },
      };
    }

    try {
      // Convert audio buffer to base64 if needed
      let audioData = request.audio;
      if (audioData instanceof Buffer) {
        audioData = audioData.toString('base64');
      }

      const response = await this.client.post('/api/v1/transcribe', {
        audio: audioData,
        audioFormat: request.audioFormat,
        language: request.language || 'en',
      });

      return {
        success: true,
        data: {
          text: response.data.text,
          language: response.data.language || request.language || 'en',
          confidence: response.data.confidence || 1.0,
        },
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Rewrite text according to profile using hosted API
   * @param request The rewrite request
   * @returns Promise resolving to rewrite response
   */
  async rewrite(request: RewriteRequest): Promise<ApiResponse<RewriteResponse>> {
    if (!this.tokenSet) {
      return {
        success: false,
        error: {
          code: 401,
          message: 'API token not set. Please configure your API token in settings.',
        },
      };
    }

    try {
      const response = await this.client.post('/api/v1/rewrite', {
        text: request.text,
        profile: request.profile,
      });

      return {
        success: true,
        data: {
          original: request.text,
          rewritten: response.data.rewritten,
          profile: request.profile,
        },
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Update the base URL from settings
   */
  updateBaseUrl(): void {
    const settings = this.settingsStore.getSettings();
    this.baseUrl = settings.hostedApiBaseUrl;
    this.client.defaults.baseURL = settings.hostedApiBaseUrl;
  }
}
