import { ipcRenderer, contextBridge } from 'electron'

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

})

// --------- Expose Electron API surface ---------
contextBridge.exposeInMainWorld('electronAPI', {
  openExternal(url: string): Promise<void> {
    // Prefer new channel; main also supports legacy 'shell:openExternal'
    return ipcRenderer.invoke('open-external', url)
  },

  onAuthTokens(callback: (payload: { accessToken: string; refreshToken: string; expiresAt: number; user?: { id: string; email: string } }) => void) {
    const listener = (_: Electron.IpcRendererEvent, payload: any) => {
      callback(payload)
    }
    ipcRenderer.on('auth:tokens', listener)
    return () => ipcRenderer.off('auth:tokens', listener)
  },

  closeApp(): void {
    ipcRenderer.send('app:close')
  },

  setIgnoreMouseEvents(ignore: boolean): Promise<void> {
    return ipcRenderer.invoke('window:setIgnoreMouseEvents', ignore)
  },
})
