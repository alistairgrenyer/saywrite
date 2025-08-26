import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { TokenStore } from './main/tokenStore.js'
import { HttpClient } from './main/http.js'
import { ApiService } from './main/api.js'
import { WhisperService } from './main/whisperService.js'
import { ConfigService } from './main/config.js'
import { LoginRequestSchema } from '../src/core/models/auth.js'
import { RewriteRequestSchema } from '../src/core/models/rewrite.js'

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
const tokenStore = new TokenStore()
const httpClient = new HttpClient(tokenStore)
const apiService = new ApiService(httpClient, tokenStore)
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

  // Set main window reference for HTTP client
  httpClient.setMainWindow(win)

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
    validateWhisperOnReady()
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// IPC Handlers
ipcMain.handle('api:login', async (_, request) => {
  try {
    const validatedRequest = LoginRequestSchema.parse(request)
    await apiService.login(validatedRequest)
    return { success: true }
  } catch (error: any) {
    throw new Error(error.message || 'Login failed')
  }
})

ipcMain.handle('api:logout', async () => {
  await apiService.logout()
})

ipcMain.handle('api:getAuthState', async () => {
  return await apiService.getAuthState()
})

// Validate whisper files after window is created
function validateWhisperOnReady() {
  const validation = configService.validateWhisperFiles()
  if (!validation.valid) {
    console.error('Whisper validation failed:', validation.errors)
    win?.webContents.send('stt:error', validation.errors.join('\n'))
  }
}

ipcMain.handle('api:transcribe', async (_, audioBlob, language) => {
  try {
    return await apiService.transcribe(audioBlob, language)
  } catch (error: any) {
    throw new Error(error.message || 'Transcription failed')
  }
})

ipcMain.handle('api:rewrite', async (_, request) => {
  try {
    const validatedRequest = RewriteRequestSchema.parse(request)
    return await apiService.rewrite(validatedRequest)
  } catch (error: any) {
    throw new Error(error.message || 'Rewrite failed')
  }
})

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
