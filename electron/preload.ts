import { ipcRenderer, contextBridge } from 'electron'
import { LoginRequest, AuthState } from '../src/core/models/auth.js'
import { RewriteRequest, RewriteResponse } from '../src/core/models/rewrite.js'
import { TranscribeResponse } from '../src/core/ports/ApiClient.js'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

// --------- Expose typed API surface ---------
contextBridge.exposeInMainWorld('app', {
  startRecording(): void {
    ipcRenderer.send('recording:start')
  },

  stopRecording(pcmData: Float32Array): Promise<void> {
    return ipcRenderer.invoke('recording:stop', pcmData.buffer)
  },

  onFinal(callback: (text: string) => void): void {
    ipcRenderer.on('stt:final', (_, text) => callback(text))
  },

  onSTTError(callback: (error: string) => void): void {
    ipcRenderer.on('stt:error', (_, error) => callback(error))
  },

  async login(request: LoginRequest): Promise<{ success: boolean }> {
    return ipcRenderer.invoke('api:login', request)
  },

  async logout(): Promise<void> {
    return ipcRenderer.invoke('api:logout')
  },

  async getAuthState(): Promise<AuthState> {
    return ipcRenderer.invoke('api:getAuthState')
  },

  async transcribe(audioBlob: Blob, language?: string): Promise<TranscribeResponse> {
    return ipcRenderer.invoke('api:transcribe', audioBlob, language)
  },

  async rewrite(request: RewriteRequest): Promise<RewriteResponse> {
    return ipcRenderer.invoke('api:rewrite', request)
  },

  onAuthExpired(callback: () => void): void {
    ipcRenderer.on('auth:expired', callback)
  },

  removeAuthExpiredListener(callback: () => void): void {
    ipcRenderer.removeListener('auth:expired', callback)
  }
})
