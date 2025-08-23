import { app, BrowserWindow, shell } from 'electron';
import { join } from 'path';
import { configureContainer } from '../di/container';
import { setupIPC } from './ipc';
import { TYPES } from '../di/symbols';
import { BackendService } from './services/BackendService';

// Initialize DI container for main process
let mainWindow: BrowserWindow | null = null;
let container: ReturnType<typeof configureContainer> = null as unknown as ReturnType<typeof configureContainer>;

// Keep a global reference of the backend service
let backendService: BackendService | null = null;

/**
 * Create the main application window
 */
function createWindow() {
  // Create the browser window with secure defaults
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false, // Frameless for overlay
    transparent: true, // Transparent background for overlay
    alwaysOnTop: true, // Always on top for overlay
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true, // Protect against prototype pollution
      nodeIntegration: false, // Disable Node.js integration in renderer
      sandbox: true, // Enable Chromium sandbox for additional security
      webSecurity: true, // Enable web security
      allowRunningInsecureContent: false, // Prevent loading insecure content
    },
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    // Dev mode: load from dev server
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in dev mode
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Production: load from built files
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'));
  }

  // We'll set up IPC handlers after container initialization

  // Open external links in default browser instead of a new Electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle window closed event
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create window when Electron has finished initialization
app.whenReady().then(async () => {
  createWindow();
  
  // Initialize the container with the main window
  container = configureContainer(mainWindow!);
  
  // Set up IPC handlers
  setupIPC(mainWindow!, container);
  
  // Get the backend service and start it
  backendService = container.get(TYPES.BackendService) as BackendService;
  const started = await backendService.startBackend();
  console.log(`Backend started: ${started}`);

  // On macOS, re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Stop the backend when the app is about to quit
app.on('will-quit', async (event: { preventDefault: () => void }) => {
  // Stop the event to allow async operations
  event.preventDefault();
  
  // Stop the backend if it's running
  if (backendService) {
    console.log('Stopping backend...');
    await backendService.stopBackend();
    console.log('Backend stopped');
  }
  
  // Now we can quit
  app.quit();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
