// @ts-ignore
import { injectable } from 'inversify';
// @ts-ignore
import { app } from 'electron';
// @ts-ignore
import * as fs from 'fs';
// @ts-ignore
import * as path from 'path';
import { SettingsStore, AppSettings, AppMode, LLMProvider } from '../../core/ports/SettingsStore';

/**
 * Implementation of SettingsStore using file system
 */
@injectable()
export class FileSettingsStore implements SettingsStore {
  private settings: AppSettings;
  private settingsPath: string;

  constructor() {
    // Default settings
    this.settings = {
      mode: 'self-hosted',
      apiBaseUrl: 'http://127.0.0.1:5175',
      hostedApiBaseUrl: 'https://api.saywrite.com',
      hostedTokenExists: false,
    };

    // Set up settings file path
    this.settingsPath = path.join(
      app.getPath('userData'),
      'settings.json'
    );

    // Load settings from file if exists
    this.loadSettings();
  }

  /**
   * Get current application settings
   * @returns The current settings
   */
  getSettings(): AppSettings {
    return { ...this.settings };
  }

  /**
   * Set application mode (self-host or hosted)
   * @param mode The app mode to set
   */
  setMode(mode: AppMode): void {
    this.settings.mode = mode;
    this.saveToFile();
  }

  /**
   * Set API URL for local or hosted mode
   * @param url The API URL
   * @param isHosted Whether this is for hosted mode
   */
  setApiUrl(url: string, isHosted: boolean): void {
    if (isHosted) {
      this.settings.hostedApiBaseUrl = url;
    } else {
      this.settings.apiBaseUrl = url;
    }
    this.saveToFile();
  }

  /**
   * Set token existence flag
   * @param exists Whether a token exists
   */
  setTokenExists(exists: boolean): void {
    this.settings.hostedTokenExists = exists;
    this.saveToFile();
  }

  /**
   * Set LLM provider
   * @param provider The LLM provider to use
   */
  setLLMProvider(provider: LLMProvider): void {
    this.settings.llmProvider = provider;
    this.saveToFile();
  }

  /**
   * Set API key
   * @param apiKey The API key to use
   */
  setApiKey(apiKey: string): void {
    this.settings.apiKey = apiKey;
    this.saveToFile();
  }

  /**
   * Save all application settings
   * @param settings The settings to save
   */
  saveSettings(settings: AppSettings): void {
    this.settings = { ...settings };
    this.saveToFile();
  }

  /**
   * Load settings from file
   */
  private loadSettings(): void {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf8');
        const loadedSettings = JSON.parse(data);
        
        // Merge with defaults to ensure all properties exist
        this.settings = {
          ...this.settings,
          ...loadedSettings,
        };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Continue with default settings
    }
  }

  /**
   * Save settings to file
   */
  private saveToFile(): void {
    try {
      // Create directory if it doesn't exist
      const dir = path.dirname(this.settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write settings to file
      fs.writeFileSync(
        this.settingsPath,
        JSON.stringify(this.settings, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }
}
