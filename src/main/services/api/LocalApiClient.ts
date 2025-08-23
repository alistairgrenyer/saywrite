// @ts-ignore - Ignore inversify module resolution issues
import * as inversify from 'inversify';
import { ApiResponse, TranscriptionRequest, TranscriptionResponse, RewriteRequest, RewriteResponse, BackendConfig } from '../../../core/ports/ApiClient';
import { BaseApiClient } from './BaseApiClient';
import { TYPES } from '../../../di/symbols';
// Use type import for decorated signature
import type { SettingsStore } from '../../../core/ports/SettingsStore';

// Add Node.js Buffer type definition
declare global {
  interface Buffer extends Uint8Array {
    toString(encoding?: string): string;
  }
  var Buffer: {
    isBuffer(obj: any): obj is Buffer;
    new(str: string, encoding?: string): Buffer;
    new(size: number): Buffer;
    new(array: Uint8Array): Buffer;
    new(arrayBuffer: ArrayBuffer): Buffer;
    new(array: any[]): Buffer;
  };
}

/**
 * Implementation of ApiClient for local/self-hosted API
 */
@inversify.injectable()
export class LocalApiClient extends BaseApiClient {
  constructor(
    @inversify.inject(TYPES.SettingsStore) private settingsStore: SettingsStore
  ) {
    // Get API URL from settings
    const settings = settingsStore.getSettings();
    super(settings.apiBaseUrl || 'http://localhost:5175');
  }

  /**
   * Transcribe audio to text using local API
   * @param request The transcription request
   * @returns Promise resolving to transcription response
   */
  async transcribe(request: TranscriptionRequest): Promise<ApiResponse<TranscriptionResponse>> {
    try {
      // Convert audio buffer to base64 if needed
      let audioData = request.audio;
      if (typeof Buffer !== 'undefined' && audioData instanceof Buffer) {
        audioData = audioData.toString('base64');
      }

      const response = await this.client.post('/v1/transcribe', {
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
   * Rewrite text according to profile using local API
   * @param request The rewrite request
   * @returns Promise resolving to rewrite response
   */
  async rewrite(request: RewriteRequest): Promise<ApiResponse<RewriteResponse>> {
    try {
      const response = await this.client.post('/v1/rewrite', {
        transcript: request.transcript,
        profile: request.profile,
        options: request.options || { temperature: 0.7 }
      });

      return {
        success: true,
        data: {
          original: request.transcript,
          rewritten: response.data.text,
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
    this.baseUrl = settings.apiBaseUrl || 'http://localhost:5175';
    this.client.defaults.baseURL = this.baseUrl;
  }
  
  /**
   * Configure the backend
   * @param config The backend configuration
   * @returns Promise resolving to void on success
   */
  async configure(config: BackendConfig): Promise<ApiResponse<void>> {
    try {
      // Update the base URL if in self-hosted mode
      if (config.mode === 'self-hosted' && config.url) {
        this.baseUrl = config.url;
        this.client.defaults.baseURL = config.url;
      } else {
        // Use default local URL
        this.baseUrl = 'http://localhost:5175';
        this.client.defaults.baseURL = this.baseUrl;
      }
      
      // Set API key if provided
      if (config.apiKey) {
        this.setAuthToken(config.apiKey);
      } else {
        this.clearAuthToken();
      }
      
      // Save configuration to settings
      const settings = this.settingsStore.getSettings();
      settings.apiBaseUrl = this.baseUrl;
      settings.mode = config.mode;
      settings.llmProvider = config.provider || 'openai';
      this.settingsStore.saveSettings(settings);
      
      return {
        success: true
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }
}
