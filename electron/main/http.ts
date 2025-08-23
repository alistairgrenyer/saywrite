import axios, { AxiosInstance, AxiosError } from 'axios';
import { TokenStore } from './tokenStore.js';
import { BrowserWindow } from 'electron';

export class HttpClient {
  private client: AxiosInstance;
  private tokenStore: TokenStore;
  private mainWindow: BrowserWindow | null = null;

  constructor(tokenStore: TokenStore, baseURL: string = 'https://api.saywrite.nously.io') {
    this.tokenStore = tokenStore;
    
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth header
    this.client.interceptors.request.use(async (config) => {
      const token = await this.tokenStore.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor to handle 401s
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear token and notify renderer
          await this.tokenStore.clearToken();
          this.notifyAuthExpired();
        }
        return Promise.reject(error);
      }
    );
  }

  private notifyAuthExpired(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('auth:expired');
    }
  }

  async get<T>(url: string): Promise<T> {
    const response = await this.client.get<T>(url);
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}
