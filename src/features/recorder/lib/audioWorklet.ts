/**
 * AudioWorklet-based audio processing to replace deprecated ScriptProcessorNode
 */

export class AudioWorkletCapture {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
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
          channelCount: this.options.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioContext = new AudioContext();
      console.log('AudioContext sample rate:', this.audioContext.sampleRate);

      // Register the audio worklet processor
      await this.audioContext.audioWorklet.addModule('/audioProcessor.js');

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.options.bufferSize;
      this.analyser.smoothingTimeConstant = 0.3;
      
      // Create AudioWorkletNode instead of ScriptProcessorNode
      this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor', {
        processorOptions: {
          bufferSize: this.options.bufferSize
        }
      });

      // Listen for audio data from the worklet
      this.workletNode.port.onmessage = (event) => {
        if (this.isRecording && event.data.type === 'audioData') {
          const audioData = new Float32Array(event.data.buffer);
          this.pcmBuffer.push(audioData);
        }
      };
      
      source.connect(this.analyser);
      source.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination);

    } catch (error) {
      throw new Error(`Failed to initialize audio capture: ${error}`);
    }
  }

  startRecording(): void {
    if (!this.analyser || !this.workletNode) {
      throw new Error('Audio capture not initialized');
    }

    this.pcmBuffer = [];
    this.isRecording = false;
    
    setTimeout(() => {
      this.pcmBuffer = [];
      this.isRecording = true;
      this.workletNode?.port.postMessage({ type: 'startRecording' });
      this.startLevelMonitoring();
      console.log('Recording started with AudioWorklet');
    }, 10);
  }

  stopRecording(): Float32Array {
    this.isRecording = false;
    this.workletNode?.port.postMessage({ type: 'stopRecording' });
    this.stopLevelMonitoring();

    console.log('Stopping recording, buffer count:', this.pcmBuffer.length);
    
    const totalLength = this.pcmBuffer.reduce((sum, buffer) => sum + buffer.length, 0);
    const result = new Float32Array(totalLength);
    let offset = 0;
    
    for (const buffer of this.pcmBuffer) {
      result.set(buffer, offset);
      offset += buffer.length;
    }

    console.log('Captured audio:', {
      bufferCount: this.pcmBuffer.length,
      samples: result.length,
      duration: result.length / (this.audioContext?.sampleRate || 16000),
      actualSampleRate: this.audioContext?.sampleRate,
      targetSampleRate: this.options.sampleRate
    });

    this.pcmBuffer = [];

    if (this.audioContext && this.audioContext.sampleRate !== this.options.sampleRate) {
      const resampled = this.resample(result, this.audioContext.sampleRate, this.options.sampleRate);
      console.log('Final resampled audio:', {
        originalSamples: result.length,
        resampledSamples: resampled.length,
        resampledDuration: resampled.length / this.options.sampleRate
      });
      return resampled;
    }

    return result;
  }

  private resample(audioData: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate) return audioData;
    
    const ratio = fromRate / toRate;
    const newLength = Math.floor(audioData.length / ratio);
    const result = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const index = Math.floor(srcIndex);
      const fraction = srcIndex - index;
      
      if (index + 1 < audioData.length) {
        result[i] = audioData[index] * (1 - fraction) + audioData[index + 1] * fraction;
      } else {
        result[i] = audioData[index];
      }
    }
    
    console.log(`Resampled from ${fromRate}Hz to ${toRate}Hz: ${audioData.length} -> ${result.length} samples`);
    return result;
  }

  private startLevelMonitoring(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateLevel = () => {
      if (!this.isRecording || !this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);

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
          rms: rms * 100,
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
    const audioContext = new AudioContext({ sampleRate: this.options.sampleRate });
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    
    const buffer = new ArrayBuffer(44 + length * channels * 2);
    const view = new DataView(buffer);
    
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
    
    if (this.workletNode) {
      this.workletNode.disconnect();
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
    this.workletNode = null;
    this.levelCallback = null;
    this.pcmBuffer = [];
  }
}

// Import types
import { AudioCaptureOptions, AudioLevelData } from '@shared/lib/types';
