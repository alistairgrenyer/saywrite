// @ts-ignore
import { injectable, inject } from 'inversify';
// @ts-ignore
import { spawn, ChildProcess } from 'child_process';
// @ts-ignore
import * as path from 'path';
// @ts-ignore
import * as fs from 'fs';
// @ts-ignore
import { app } from 'electron';
import { TYPES } from '../../di/symbols';
// Use namespace import to fix decorated signature error
import * as SettingsTypes from '../../core/ports/SettingsStore';
type SettingsStore = SettingsTypes.SettingsStore;

/**
 * Service for managing the Python FastAPI backend
 */
@injectable()
export class BackendService {
  private backendProcess: ChildProcess | null = null;
  private backendPort: number = 5175;
  private isRunning: boolean = false;

  constructor(
    @inject(TYPES.SettingsStore) private settingsStore: SettingsStore
  ) {}

  /**
   * Start the Python backend process
   */
  async startBackend(): Promise<boolean> {
    if (this.isRunning) {
      console.log('Backend is already running');
      return true;
    }

    try {
      const settings = this.settingsStore.getSettings();
      
      // Only start the backend if we're in local or self-hosted mode
      if (settings.mode !== 'local' && settings.mode !== 'self-hosted') {
        console.log(`Not starting backend - not in local/self-hosted mode (current mode: ${settings.mode})`);
        return false;
      }

      // Get the backend directory path
      const appPath = app.getAppPath();
      const backendDir = path.join(appPath, 'backend');
      
      // Check if Python is installed
      // @ts-ignore - process is available in Electron
      const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
      
      // Prepare environment variables
      // @ts-ignore - process is available in Electron
      const env = {
        ...process.env,
        PORT: this.backendPort.toString(),
        LLM_PROVIDER: settings.llmProvider || 'openai',
        OPENAI_API_KEY: settings.apiKey || '',
      };
      
      // Start the backend process
      console.log('Starting backend process...');
      this.backendProcess = spawn(
        pythonCommand,
        ['-m', 'app.main'],
        {
          cwd: backendDir,
          env,
          stdio: 'pipe'
        }
      );
      
      // Handle process events
      this.backendProcess.stdout?.on('data', (data: any) => {
        console.log(`Backend stdout: ${data}`);
      });
      
      this.backendProcess.stderr?.on('data', (data: any) => {
        console.error(`Backend stderr: ${data}`);
      });
      
      this.backendProcess.on('close', (code: any) => {
        console.log(`Backend process exited with code ${code}`);
        this.isRunning = false;
        this.backendProcess = null;
      });
      
      this.isRunning = true;
      console.log('Backend started successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to start backend:', error);
      return false;
    }
  }

  /**
   * Stop the Python backend process
   */
  async stopBackend(): Promise<boolean> {
    if (!this.isRunning || !this.backendProcess) {
      console.log('Backend is not running');
      return true;
    }

    try {
      console.log('Stopping backend process...');
      
      // Kill the process
      // @ts-ignore - process is available in Electron
      if (process.platform === 'win32') {
        // Windows requires taskkill to kill the process tree
        spawn('taskkill', ['/pid', this.backendProcess.pid?.toString() || '', '/f', '/t']);
      } else {
        // Unix-like systems can use the kill command
        this.backendProcess.kill('SIGTERM');
      }
      
      this.isRunning = false;
      this.backendProcess = null;
      console.log('Backend stopped successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to stop backend:', error);
      return false;
    }
  }

  /**
   * Restart the Python backend process
   */
  async restartBackend(): Promise<boolean> {
    await this.stopBackend();
    return this.startBackend();
  }

  /**
   * Check if the backend is running
   */
  isBackendRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get the backend URL
   */
  getBackendUrl(): string {
    return `http://localhost:${this.backendPort}`;
  }
}
