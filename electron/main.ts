import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { TokenStore } from './main/tokenStore.js'
import { HttpClient } from './main/http.js'
import { ApiService } from './main/api.js'
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

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Set main window reference for HTTP client
  httpClient.setMainWindow(win)

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
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
    win = null
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
