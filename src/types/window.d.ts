import { LoginRequest, AuthState } from '../core/models/auth.js';
import { RewriteRequest, RewriteResponse } from '../core/models/rewrite.js';
import { TranscribeResponse } from '../core/ports/ApiClient.js';

declare global {
  interface Window {
    app: {
      startRecording(): void
      stopRecording(pcmData: Float32Array): Promise<void>
      onFinal(callback: (text: string) => void): void
      onSTTError(callback: (error: string) => void): void
      login(request: LoginRequest): Promise<{ success: boolean }>
      logout(): Promise<void>
      getAuthState(): Promise<AuthState>
      transcribe(audioBlob: Blob, language?: string): Promise<TranscribeResponse>
      rewrite(request: RewriteRequest): Promise<RewriteResponse>
      onAuthExpired(callback: () => void): void
      removeAuthExpiredListener(callback: () => void): void
    }
  }
}

export {};
