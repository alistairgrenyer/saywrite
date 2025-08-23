import 'reflect-metadata';
import { Container } from 'inversify';
// @ts-ignore - Ignore electron module resolution issues
import { BrowserWindow } from 'electron';
import { TYPES } from './symbols';

// Interfaces
import { ApiClient } from '../core/ports/ApiClient';
import { STTProvider } from '../core/ports/STTProvider';
import { LLMProvider } from '../core/ports/LLMProvider';
import { ClipboardService } from '../core/ports/ClipboardService';
import { InsertionService } from '../core/ports/InsertionService';
import { HotkeyService } from '../core/ports/HotkeyService';
import { ProfilesStore } from '../core/ports/ProfilesStore';
import { SettingsStore } from '../core/ports/SettingsStore';

// Service implementations
import { LocalApiClient } from '../main/services/api/LocalApiClient';
import { HostedApiClient } from '../main/services/api/HostedApiClient';
import { STTProviderImpl } from '../main/services/STTProviderImpl';
import { LLMProviderImpl } from '../main/services/LLMProviderImpl';
import { ElectronClipboardService } from '../main/services/ElectronClipboardService';
import { NutJsInsertionService } from '../main/services/NutJsInsertionService';
import { ElectronHotkeyService } from '../main/services/ElectronHotkeyService';
import { FileSettingsStore } from '../main/services/FileSettingsStore';
import { FileProfilesStore } from '../main/services/FileProfilesStore';
import { BackendService } from '../main/services/BackendService';

// Create container instance
const container = new Container();

/**
 * Configure the DI container
 * @param mainWindow The main window instance
 * @returns Configured container
 */
export function configureContainer(mainWindow: BrowserWindow): Container {
  // Register mainWindow for injection
  container.bind<BrowserWindow>(TYPES.MainWindow).toConstantValue(mainWindow);
  
  // Register services
  container.bind<SettingsStore>(TYPES.SettingsStore).to(FileSettingsStore).inSingletonScope();
  container.bind<ProfilesStore>(TYPES.ProfilesStore).to(FileProfilesStore).inSingletonScope();
  container.bind<ClipboardService>(TYPES.ClipboardService).to(ElectronClipboardService).inSingletonScope();
  container.bind<InsertionService>(TYPES.InsertionService).to(NutJsInsertionService).inSingletonScope();
  container.bind<HotkeyService>(TYPES.HotkeyService).to(ElectronHotkeyService).inSingletonScope();
  container.bind<BackendService>(TYPES.BackendService).to(BackendService).inSingletonScope();
  
  // Register API clients
  container.bind<ApiClient>(TYPES.LocalApiClient).to(LocalApiClient).inSingletonScope();
  container.bind<ApiClient>(TYPES.HostedApiClient).to(HostedApiClient).inSingletonScope();
  
  // Register STT and LLM providers
  container.bind<STTProvider>(TYPES.STTProvider).to(STTProviderImpl).inSingletonScope();
  container.bind<LLMProvider>(TYPES.LLMProvider).to(LLMProviderImpl).inSingletonScope();
  
  // Dynamically bind the correct ApiClient based on settings
  const settingsStore = container.get<SettingsStore>(TYPES.SettingsStore);
  const settings = settingsStore.getSettings();
  
  if (settings.mode === 'local' || settings.mode === 'self-hosted') {
    container.bind<ApiClient>(TYPES.ApiClient).toService(TYPES.LocalApiClient);
  } else {
    container.bind<ApiClient>(TYPES.ApiClient).toService(TYPES.HostedApiClient);
  }
  
  return container;
}

export default container;
