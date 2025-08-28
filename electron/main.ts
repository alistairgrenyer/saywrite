import { app, BrowserWindow, ipcMain, shell, screen } from 'electron'
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
type AuthPayload = {
  accessToken: string
  refreshToken: string
  expiresAt: number
  user?: { id: string; email: string }
}
let pendingAuthPayload: AuthPayload | null = null

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

// Back-compat and new channel for opening external URLs
ipcMain.handle('open-external', async (_, url: string) => {
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

// Allow renderer to toggle click-through interactivity
ipcMain.handle('window:setIgnoreMouseEvents', (_evt, ignore: boolean) => {
  if (win && !win.isDestroyed()) {
    try {
      win.setIgnoreMouseEvents(Boolean(ignore), { forward: true })
    } catch {}
  }
})

function createWindow() {
  // Prefer app.isPackaged over NODE_ENV for reliable env detection in Electron
  const isDev = !app.isPackaged
  const useDebugWindow = isDev && process.env.DEBUG_WINDOW === '1'

  if (useDebugWindow) {
    // Debug window keeps the small movable frame
    win = new BrowserWindow({
      width: 480,
      height: 360,
      frame: true,
      transparent: false,
      backgroundColor: '#1e1e1e',
      alwaysOnTop: true,
      resizable: true,
      skipTaskbar: false,
      hasShadow: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.mjs'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    })
  } else {
    // Overlay mode: full-screen, transparent, click-through except the bubble
    const { bounds } = screen.getPrimaryDisplay()
    win = new BrowserWindow({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      hasShadow: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.mjs'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    })
    // Make the window click-through by default; renderer will disable over the bubble
    win.setIgnoreMouseEvents(true, { forward: true })
  }

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

  // If there is a pending auth payload (arrived before window was ready), deliver it now
  if (pendingAuthPayload) {
    win.webContents.send('auth:tokens', pendingAuthPayload)
    pendingAuthPayload = null
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

// ---------- Deep link handling ----------
function tryParseAuthCallback(rawUrl: string): AuthPayload | null {
  try {
    const url = new URL(rawUrl)
    if (url.protocol !== 'saywrite:' || url.hostname !== 'auth' || url.pathname !== '/callback') {
      return null
    }

    const accessToken = url.searchParams.get('access_token') || ''
    const refreshToken = url.searchParams.get('refresh_token') || ''
    const expiresInStr = url.searchParams.get('expires_in') || '0'
    const email = url.searchParams.get('email') || undefined
    const id = url.searchParams.get('id') || undefined

    const expiresIn = Number(expiresInStr)
    if (!accessToken || !refreshToken || !Number.isFinite(expiresIn) || expiresIn <= 0) {
      return null
    }

    const payload: AuthPayload = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
      user: email || id ? { id: id || '', email: email || '' } : undefined,
    }
    return payload
  } catch {
    return null
  }
}

function handleIncomingDeepLink(rawUrl: string) {
  const payload = tryParseAuthCallback(rawUrl)
  if (!payload) return
  if (win) {
    win.webContents.send('auth:tokens', payload)
  } else {
    pendingAuthPayload = payload
  }
}

// Ensure single instance to route deep links to the primary instance
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    // Windows/Linux deep link is in argv
    const deeplinkArg = argv.find(arg => typeof arg === 'string' && arg.startsWith('saywrite://'))
    if (deeplinkArg) {
      handleIncomingDeepLink(deeplinkArg)
    }
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.whenReady().then(() => {
    // Register protocol client
    // In packaged apps, a simple call works. In dev on Windows/Linux, pass args.
    const isPackaged = app.isPackaged
    const isWindows = process.platform === 'win32'
    const isLinux = process.platform === 'linux'
    try {
      if (!isPackaged && (isWindows || isLinux)) {
        // Register using the current executable and the first arg (the app entry)
        // This helps Windows route the protocol back to the running dev process
        const exe = process.execPath
        const args = [process.argv[1]]
        app.setAsDefaultProtocolClient('saywrite', exe, args)
      } else {
        app.setAsDefaultProtocolClient('saywrite')
      }
    } catch (e) {
      console.error('Failed to register protocol handler:', e)
    }

    // macOS deep link handler
    app.on('open-url', (event, url) => {
      event.preventDefault()
      handleIncomingDeepLink(url)
    })

    // Windows: initial run may include the link in process.argv
    if (process.platform === 'win32' && process.argv.length > 1) {
      const deeplinkArg = process.argv.find(arg => arg.startsWith('saywrite://'))
      if (deeplinkArg) {
        handleIncomingDeepLink(deeplinkArg)
      }
    }

    createWindow()
  })
}
