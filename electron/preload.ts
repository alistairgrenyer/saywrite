import { ipcRenderer, contextBridge } from 'electron'
import { LoginRequest, AuthState } from '../src/core/models/auth.js'
import { RewriteRequest, RewriteResponse } from '../src/core/models/rewrite.js'

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
  async login(request: LoginRequest): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      await ipcRenderer.invoke('api:login', request)
      return { ok: true }
    } catch (error: any) {
      return { ok: false, error: error.message || 'Login failed' }
    }
  },

  async logout(): Promise<void> {
    return ipcRenderer.invoke('api:logout')
  },

  async getAuthState(): Promise<AuthState> {
    return ipcRenderer.invoke('api:getAuthState')
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
