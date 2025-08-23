// @ts-ignore - Ignore axios module resolution issues
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ApiClient, ApiResponse, TranscriptionRequest, TranscriptionResponse, RewriteRequest, RewriteResponse, BackendConfig, HealthResponse } from '../../../core/ports/ApiClient';

/**
 * Base implementation for API clients with common functionality
 */
export abstract class BaseApiClient implements ApiClient {
  protected client: AxiosInstance;
  protected baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Set authorization token for API requests
   * @param token The authorization token
   */
  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear authorization token
   */
  clearAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }

  /**
   * Check if the API is healthy
   * @returns Promise resolving to API health status
   */
  async checkHealth(): Promise<ApiResponse<HealthResponse>> {
    try {
      const response = await this.client.get('/health');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Transcribe audio to text
   * @param request The transcription request
   * @returns Promise resolving to transcription response
   */
  abstract transcribe(request: TranscriptionRequest): Promise<ApiResponse<TranscriptionResponse>>;

  /**
   * Rewrite text according to profile
   * @param request The rewrite request
   * @returns Promise resolving to rewrite response
   */
  abstract rewrite(request: RewriteRequest): Promise<ApiResponse<RewriteResponse>>;
  
  /**
   * Configure the backend
   * @param config The backend configuration
   * @returns Promise resolving to void on success
   */
  abstract configure(config: BackendConfig): Promise<ApiResponse<void>>;

  /**
   * Handle API errors in a consistent way
   * @param error The error from axios
   * @returns Standardized API error response
   */
  protected handleApiError(error: any): ApiResponse<any> {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.message || error.message || 'Unknown API error';
      
      return {
        success: false,
        error: {
          code: statusCode,
          message: errorMessage,
        },
      };
    }
    
    return {
      success: false,
      error: {
        code: 500,
        message: error.message || 'Unknown error occurred',
      },
    };
  }
}
