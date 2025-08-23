/**
 * Type for application mode
 */
export type AppMode = 'local' | 'self-hosted' | 'hosted';

/**
 * Type for LLM provider
 */
export type LLMProvider = 'openai' | 'anthropic';

/**
 * Interface for application settings
 */
export interface AppSettings {
  mode: AppMode;
  apiBaseUrl: string;
  hostedApiBaseUrl: string;
  hostedTokenExists?: boolean;
  llmProvider?: LLMProvider;
  apiKey?: string;
}

/**
 * Interface for settings storage operations
 */
export interface SettingsStore {
  /**
   * Get all application settings
   * @returns The application settings
   */
  getSettings(): AppSettings;
  
  /**
   * Save all application settings
   * @param settings The settings to save
   */
  saveSettings(settings: AppSettings): void;
  
  /**
   * Set application mode (local, self-hosted, or hosted)
   * @param mode The app mode to set
   */
  setMode(mode: AppMode): void;
  
  /**
   * Set API URL for local or hosted mode
   * @param url The API URL
   * @param isHosted Whether this is for hosted mode
   */
  setApiUrl(url: string, isHosted: boolean): void;
  
  /**
   * Set token existence flag
   * @param exists Whether a token exists
   */
  setTokenExists(exists: boolean): void;
  
  /**
   * Set LLM provider
   * @param provider The LLM provider to use
   */
  setLLMProvider(provider: LLMProvider): void;
  
  /**
   * Set API key
   * @param apiKey The API key to use
   */
  setApiKey(apiKey: string): void;
}
