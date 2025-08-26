import { spawn } from 'child_process';
import { unlinkSync, existsSync } from 'fs';
import { ConfigService } from './config.js';
import { WavWriter } from './wavWriter.js';

export interface WhisperResult {
  text: string;
  confidence?: number;
  duration?: number;
}

export class WhisperService {
  private configService: ConfigService;

  constructor() {
    this.configService = new ConfigService();
  }

  async transcribeFromPCM(pcmData: Float32Array, sessionId: string): Promise<WhisperResult> {
    const validation = this.configService.validateWhisperFiles();
    if (!validation.valid) {
      throw new Error(validation.errors.join('\n'));
    }

    const config = this.configService.getWhisperConfig();
    const tempWavPath = this.configService.getTempWavPath(sessionId);

    try {
      // Write PCM data as WAV file
      WavWriter.writePCM16(tempWavPath, pcmData, 16000);

      // Run whisper transcription
      const result = await this.runWhisper(tempWavPath, config);
      
      return result;
    } finally {
      // Clean up temporary file
      try {
        if (existsSync(tempWavPath)) unlinkSync(tempWavPath);
      } catch (error) {
        console.warn('Failed to clean up temporary WAV file:', error);
      }
    }
  }

  private runWhisper(wavPath: string, config: any): Promise<WhisperResult> {
    return new Promise((resolve, reject) => {
      const args = [
        '-m', config.modelPath,
        '-f', wavPath,
        '--language', config.language,
        '--no-timestamps',
        '--print-special', 'false',
        '--suppress-nst',
        '--temperature', '0.0',
        '--best-of', '1',
        '--beam-size', '1',
        '--word-thold', '0.01',
        '--threads', config.threads.toString()
      ];

      console.log('Running whisper with args:', args);

      const whisperProcess = spawn(config.binPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd() // Set working directory to project root
      });

      let stdout = '';
      let stderr = '';

      whisperProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      whisperProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      whisperProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Whisper process failed with code ${code}\nStderr: ${stderr}\nStdout: ${stdout}`));
          return;
        }

        try {
          // Parse stdout and clean up special tokens
          const cleanText = stdout
            .replace(/<\|endoftext\|>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          
          resolve({
            text: cleanText,
            confidence: undefined,
            duration: undefined
          });
        } catch (error) {
          reject(new Error(`Failed to parse transcription result: ${error}`));
        }
      });

      whisperProcess.on('error', (error) => {
        reject(new Error(`Failed to start whisper process: ${error.message}`));
      });

      // Set timeout for long-running transcriptions
      setTimeout(() => {
        if (!whisperProcess.killed) {
          whisperProcess.kill();
          reject(new Error('Whisper transcription timed out after 60 seconds'));
        }
      }, 60000);
    });
  }

  validatePrerequisites(): { valid: boolean; errors: string[] } {
    return this.configService.validateWhisperFiles();
  }
}
