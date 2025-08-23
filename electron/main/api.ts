import { HttpClient } from './http.js';
import { TokenStore } from './tokenStore.js';
import { 
  LoginRequest, 
  LoginResponse, 
  LoginRequestSchema, 
  LoginResponseSchema 
} from '../../src/core/models/auth.js';
import { 
  RewriteRequest, 
  RewriteResponse, 
  RewriteRequestSchema, 
  RewriteResponseSchema 
} from '../../src/core/models/rewrite.js';
import { AxiosError } from 'axios';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export class ApiService {
  private http: HttpClient;
  private tokenStore: TokenStore;

  constructor(http: HttpClient, tokenStore: TokenStore) {
    this.http = http;
    this.tokenStore = tokenStore;
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      // Validate request
      const validatedRequest = LoginRequestSchema.parse(request);
      
      // Make API call
      const response = await this.http.post<LoginResponse>('/v1/auth/login', validatedRequest);
      
      // Validate response
      const validatedResponse = LoginResponseSchema.parse(response);
      
      // Store token
      await this.tokenStore.setToken(validatedResponse.access_token);
      
      return validatedResponse;
    } catch (error) {
      throw this.handleApiError(error, 'LOGIN_FAILED');
    }
  }

  async logout(): Promise<void> {
    try {
      await this.tokenStore.clearToken();
    } catch (error) {
      throw this.handleApiError(error, 'LOGOUT_FAILED');
    }
  }

  async rewrite(request: RewriteRequest): Promise<RewriteResponse> {
    try {
      // Validate request
      const validatedRequest = RewriteRequestSchema.parse(request);
      
      // Make API call
      const response = await this.http.post<RewriteResponse>('/v1/rewrite', validatedRequest);
      
      // Validate response
      const validatedResponse = RewriteResponseSchema.parse(response);
      
      return validatedResponse;
    } catch (error) {
      throw this.handleApiError(error, 'REWRITE_FAILED');
    }
  }

  async getAuthState(): Promise<{ authenticated: boolean }> {
    try {
      const authenticated = await this.tokenStore.isAuthenticated();
      return { authenticated };
    } catch (error) {
      return { authenticated: false };
    }
  }

  private handleApiError(error: unknown, defaultCode: string): ApiError {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const data = error.response?.data;
      
      switch (status) {
        case 400:
          return {
            code: 'BAD_REQUEST',
            message: data?.message || 'Invalid request data',
            details: data
          };
        case 401:
          return {
            code: 'UNAUTHORIZED',
            message: 'Invalid credentials or expired token'
          };
        case 403:
          return {
            code: 'FORBIDDEN',
            message: 'Access denied'
          };
        case 404:
          return {
            code: 'NOT_FOUND',
            message: 'Endpoint not found'
          };
        case 429:
          return {
            code: 'RATE_LIMITED',
            message: 'Too many requests, please try again later'
          };
        case 500:
          return {
            code: 'SERVER_ERROR',
            message: 'Internal server error'
          };
        default:
          if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return {
              code: 'NETWORK_ERROR',
              message: 'Cannot reach the API server. Please check your internet connection.'
            };
          }
          return {
            code: defaultCode,
            message: data?.message || error.message || 'An unexpected error occurred'
          };
      }
    }
    
    if (error instanceof Error) {
      return {
        code: defaultCode,
        message: error.message
      };
    }
    
    return {
      code: defaultCode,
      message: 'An unexpected error occurred'
    };
  }
}
