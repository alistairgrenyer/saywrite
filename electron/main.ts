import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { WhisperService } from './main/whisperService.js'
import { ConfigService } from './main/config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

// Initialize services
const whisperService = new WhisperService()
const configService = new ConfigService()

let win: BrowserWindow | null

// Register IPC handlers immediately
// Recording handlers
ipcMain.on('recording:start', () => {
  console.log('Recording started')
})

ipcMain.handle('recording:stop', async (_, pcmF32Buf: ArrayBuffer) => {
  try {
    console.log('Recording stopped, processing audio...')
    const pcmF32 = new Float32Array(pcmF32Buf)
    const sessionId = `session_${Date.now()}`
    
    const result = await whisperService.transcribeFromPCM(pcmF32, sessionId)
    win?.webContents.send('stt:final', result.text)
    
    return result
  } catch (error: any) {
    console.error('Transcription failed:', error)
    win?.webContents.send('stt:error', error.message || 'Transcription failed')
    throw error
  }
})

// Shell handlers
ipcMain.handle('shell:openExternal', async (_, url: string) => {
  try {
    await shell.openExternal(url)
  } catch (error) {
    console.error('Failed to open external URL:', error)
    throw error
  }
})

// App handlers
ipcMain.on('app:close', () => {
  app.quit()
})

function createWindow() {
  const isDev = process.env.NODE_ENV === 'development';
  
  win = new BrowserWindow({
    width: isDev ? 500 : 300,
    height: isDev ? 400 : 200,
    frame: isDev, // Show frame in dev for easier debugging
    transparent: !isDev, // Only transparent in production
    alwaysOnTop: true,
    resizable: isDev, // Allow resizing in dev
    skipTaskbar: !isDev, // Show in taskbar during dev
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Ensure it stays on top even above fullscreen apps
  win.setAlwaysOnTop(true, "screen-saver")


  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
    validateWhisperOnReady()
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Validate whisper files after window is created
function validateWhisperOnReady() {
  const validation = configService.validateWhisperFiles()
  if (!validation.valid) {
    console.error('Whisper validation failed:', validation.errors)
    win?.webContents.send('stt:error', validation.errors.join('\n'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
