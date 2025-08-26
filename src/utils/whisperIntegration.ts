export interface WhisperConfig {
  modelPath: string;
  language: string;
  temperature: number;
}

export interface WhisperResult {
  text: string;
  confidence?: number;
  duration?: number;
}

export class WhisperIntegration {
  constructor(private config: WhisperConfig) {}

  async transcribe(audioBuffer: ArrayBuffer): Promise<WhisperResult> {
    try {
      // Convert ArrayBuffer to Float32Array for PCM processing
      const pcmData = new Float32Array(audioBuffer);
      
      // Send PCM data directly to main process for local whisper processing
      await window.app.stopRecording(pcmData);
      
      // The result comes back via the onFinal callback, not as a return value
      // This is the primary transcription method for local Whisper.cpp
      return {
        text: '', // Will be populated via IPC callback
        confidence: undefined,
        duration: undefined
      };
    } catch (error) {
      console.error('Whisper transcription failed:', error);
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async transcribeFromPCM(pcmData: Float32Array): Promise<WhisperResult> {
    try {
      // Send PCM data directly to main process for local whisper processing
      // This triggers the recording:stop IPC handler which processes via whisper
      await window.app.stopRecording(pcmData);
      
      // The result comes back via the onFinal callback, not as a return value
      // This method is used internally by the audio capture system
      return {
        text: '', // Will be populated via IPC callback
        confidence: undefined,
        duration: undefined
      };
    } catch (error) {
      console.error('Local whisper transcription failed:', error);
      throw new Error(`Local transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getConfig(): WhisperConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<WhisperConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  static getDefaultConfig(): WhisperConfig {
    return {
      modelPath: './whisper/models/ggml-base.en.bin',
      language: 'en',
      temperature: 0.0
    };
  }
}
