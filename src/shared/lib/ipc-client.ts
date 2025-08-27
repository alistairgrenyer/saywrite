/**
 * Typed IPC client for renderer process
 * Provides type-safe communication with main process
 */

export interface IPCClient {
  startRecording(): void;
  stopRecording(pcmData: Float32Array): Promise<void>;
  onFinal(callback: (text: string) => void): void;
  onSTTError(callback: (error: string) => void): void;
}

export const ipcClient: IPCClient = {
  startRecording(): void {
    window.app.startRecording();
  },

  stopRecording(pcmData: Float32Array): Promise<void> {
    return window.app.stopRecording(pcmData);
  },

  onFinal(callback: (text: string) => void): void {
    window.app.onFinal(callback);
  },

  onSTTError(callback: (error: string) => void): void {
    window.app.onSTTError(callback);
  },
};
