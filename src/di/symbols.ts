/**
 * Symbols for dependency injection
 */
export const TYPES = {
  // Core components
  MainWindow: Symbol.for('MainWindow'),
  
  // API and providers
  ApiClient: Symbol.for('ApiClient'),
  LocalApiClient: Symbol.for('LocalApiClient'),
  HostedApiClient: Symbol.for('HostedApiClient'),
  STTProvider: Symbol.for('STTProvider'),
  LLMProvider: Symbol.for('LLMProvider'),
  
  // OS services
  ClipboardService: Symbol.for('ClipboardService'),
  InsertionService: Symbol.for('InsertionService'),
  HotkeyService: Symbol.for('HotkeyService'),
  BackendService: Symbol.for('BackendService'),
  
  // Storage services
  ProfilesStore: Symbol.for('ProfilesStore'),
  SettingsStore: Symbol.for('SettingsStore'),
};
