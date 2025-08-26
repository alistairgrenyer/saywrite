declare global {
  interface Window {
    app: {
      startRecording(): void
      stopRecording(pcmData: Float32Array): Promise<void>
      onFinal(callback: (text: string) => void): void
      onSTTError(callback: (error: string) => void): void
    }
  }
}

export {};
