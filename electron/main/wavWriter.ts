import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export class WavWriter {
  static writePCM16(filePath: string, pcmData: Float32Array, sampleRate: number = 16000): void {
    // Ensure directory exists
    mkdirSync(dirname(filePath), { recursive: true });

    // Convert Float32 PCM to Int16
    const int16Data = new Int16Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      const sample = Math.max(-1, Math.min(1, pcmData[i]));
      int16Data[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }

    // Create WAV header
    const channels = 1; // Mono
    const bitsPerSample = 16;
    const blockAlign = channels * bitsPerSample / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = int16Data.length * 2;
    const fileSize = 44 + dataSize;

    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, fileSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM format chunk size
    view.setUint16(20, 1, true);  // PCM format
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Write PCM data
    for (let i = 0; i < int16Data.length; i++) {
      view.setInt16(44 + i * 2, int16Data[i], true);
    }

    writeFileSync(filePath, Buffer.from(buffer));
  }
}
