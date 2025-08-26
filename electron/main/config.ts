import { app } from 'electron';
import { join } from 'path';
import { existsSync } from 'fs';

export interface WhisperConfig {
  binPath: string;
  modelPath: string;
  language: string;
  threads: number;
}

export class ConfigService {
  constructor() {
    // Configuration service for whisper paths and validation
  }

  getWhisperConfig(): WhisperConfig {
    const isDev = process.env.NODE_ENV === 'development';
    const basePath = isDev ? process.cwd() : process.resourcesPath;
    
    return {
      binPath: join(basePath, 'whisper', 'bin', 'whisper-cli.exe'),
      modelPath: join(basePath, 'whisper', 'models', 'ggml-base.en.bin'),
      language: 'en',
      threads: 4
    };
  }

  validateWhisperFiles(): { valid: boolean; errors: string[] } {
    const config = this.getWhisperConfig();
    const errors: string[] = [];

    if (!existsSync(config.binPath)) {
      errors.push(`Whisper executable not found at: ${config.binPath}`);
      errors.push('Please place whisper-cli.exe in whisper/bin/ directory');
    }

    if (!existsSync(config.modelPath)) {
      errors.push(`Whisper model not found at: ${config.modelPath}`);
      errors.push('Please place ggml-base.en.bin in whisper/models/ directory');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  getTempWavPath(sessionId: string): string {
    const tempDir = join(app.getPath('userData'), 'tmp');
    return join(tempDir, `${sessionId}.wav`);
  }
}
