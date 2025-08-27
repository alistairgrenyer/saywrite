/**
 * Shared type definitions across features
 */

export interface Position {
  x: number;
  y: number;
}

export interface AudioLevelData {
  rms: number;
  peak: number;
  timestamp: number;
}

export interface AudioCaptureOptions {
  sampleRate: number;
  channels: number;
  bufferSize: number;
}

export interface RecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  isInitializing: boolean;
  duration: number;
  size: number;
  audioLevel: AudioLevelData;
}

export interface TranscriptState {
  text: string;
  isProcessing: boolean;
  audioData: ArrayBuffer | null;
  recordingDuration: number;
}

export interface BubbleState {
  position: Position;
  isDragging: boolean;
}

export interface AppError {
  message: string;
  type: 'audio' | 'stt' | 'general';
}
