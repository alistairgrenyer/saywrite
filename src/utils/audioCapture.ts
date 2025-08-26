export interface AudioCaptureOptions {
  sampleRate: number;
  channels: number;
  bufferSize: number;
}

export interface AudioLevelData {
  rms: number;
  peak: number;
  timestamp: number;
}

export class AudioCapture {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private pcmBuffer: Float32Array[] = [];
  private levelCallback: ((level: AudioLevelData) => void) | null = null;
  private animationFrame: number | null = null;
  private isRecording = false;

  constructor(private options: AudioCaptureOptions = {
    sampleRate: 16000,
    channels: 1,
    bufferSize: 2048
  }) {}

  async initialize(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.options.sampleRate,
          channelCount: this.options.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioContext = new AudioContext({ sampleRate: this.options.sampleRate });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.options.bufferSize;
      this.analyser.smoothingTimeConstant = 0.3;
      
      // Set up script processor for PCM capture
      this.scriptProcessor = this.audioContext.createScriptProcessor(this.options.bufferSize, 1, 1);
      this.scriptProcessor.onaudioprocess = (event) => {
        if (this.isRecording) {
          const inputBuffer = event.inputBuffer;
          const inputData = inputBuffer.getChannelData(0);
          this.pcmBuffer.push(new Float32Array(inputData));
        }
      };
      
      source.connect(this.analyser);
      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

    } catch (error) {
      throw new Error(`Failed to initialize audio capture: ${error}`);
    }
  }

  startRecording(): void {
    if (!this.analyser || !this.scriptProcessor) {
      throw new Error('Audio capture not initialized');
    }

    this.pcmBuffer = [];
    this.isRecording = true;
    this.startLevelMonitoring();
  }

  stopRecording(): Float32Array {
    this.isRecording = false;
    this.stopLevelMonitoring();

    // Concatenate all PCM buffers
    const totalLength = this.pcmBuffer.reduce((sum, buffer) => sum + buffer.length, 0);
    const result = new Float32Array(totalLength);
    let offset = 0;
    
    for (const buffer of this.pcmBuffer) {
      result.set(buffer, offset);
      offset += buffer.length;
    }

    return result;
  }

  private startLevelMonitoring(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateLevel = () => {
      if (!this.isRecording || !this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);

      // Calculate RMS (root mean square) for volume level
      let sum = 0;
      let peak = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i] / 255.0;
        sum += value * value;
        peak = Math.max(peak, value);
      }

      const rms = Math.sqrt(sum / bufferLength);

      if (this.levelCallback) {
        this.levelCallback({
          rms: rms * 100, // Convert to 0-100 scale
          peak: peak * 100,
          timestamp: Date.now()
        });
      }

      this.animationFrame = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  }

  private stopLevelMonitoring(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  setLevelCallback(callback: (level: AudioLevelData) => void): void {
    this.levelCallback = callback;
  }

  async convertToWav(audioBlob: Blob): Promise<ArrayBuffer> {
    // Convert WebM/Opus to WAV PCM for Whisper
    const audioContext = new AudioContext({ sampleRate: this.options.sampleRate });
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Convert to 16-bit PCM WAV
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    
    // Create WAV header
    const buffer = new ArrayBuffer(44 + length * channels * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * channels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * channels * 2, true);
    
    // Convert audio data to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < channels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return buffer;
  }

  dispose(): void {
    this.stopLevelMonitoring();
    
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    
    this.mediaStream = null;
    this.audioContext = null;
    this.analyser = null;
    this.scriptProcessor = null;
    this.levelCallback = null;
    this.pcmBuffer = [];
  }
}
