import { Profile } from '../types/Profile';

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: string;
  version?: string;
}

/**
 * Transcription request parameters
 */
export interface TranscriptionRequest {
  audio: Buffer | string; // Binary buffer or base64 string
  audioFormat: string; // e.g., 'wav', 'mp3'
  language?: string; // e.g., 'en', 'fr'
}

/**
 * Transcription response data
 */
export interface TranscriptionResponse {
  text: string;
  language: string;
  confidence: number;
}

/**
 * Rewrite request parameters
 */
export interface RewriteRequest {
  transcript: string;
  profile: Profile;
  options?: {
    temperature?: number;
  };
}

/**
 * Rewrite response data
 */
export interface RewriteResponse {
  original: string;
  rewritten: string;
  profile: Profile;
}

/**
 * Backend configuration
 */
export interface BackendConfig {
  mode: 'local' | 'self-hosted';
  url?: string; // URL for self-hosted mode
  apiKey?: string; // API key for authentication
  provider?: 'openai' | 'anthropic'; // LLM provider
}

/**
 * API Client interface
 */
export interface ApiClient {
  /**
   * Check if the API is available
   * @returns Promise resolving to health response
   */
  checkHealth(): Promise<ApiResponse<HealthResponse>>;
  
  /**
   * Transcribe audio to text
   * @param request The transcription request
   * @returns Promise resolving to transcription response
   */
  transcribe(request: TranscriptionRequest): Promise<ApiResponse<TranscriptionResponse>>;
  
  /**
   * Rewrite text using LLM
   * @param request The rewrite request
   * @returns Promise resolving to rewrite response
   */
  rewrite(request: RewriteRequest): Promise<ApiResponse<RewriteResponse>>;
  
  /**
   * Configure the backend
   * @param config The backend configuration
   * @returns Promise resolving to void on success
   */
  configure(config: BackendConfig): Promise<ApiResponse<void>>;
}
