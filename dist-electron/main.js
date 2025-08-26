var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { app, ipcMain, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawn } from "child_process";
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "fs";
import { join, dirname } from "path";
class ConfigService {
  constructor() {
  }
  getWhisperConfig() {
    const isDev = process.env.NODE_ENV === "development";
    const basePath = isDev ? process.cwd() : process.resourcesPath;
    return {
      binPath: join(basePath, "whisper", "bin", "whisper-cli.exe"),
      modelPath: join(basePath, "whisper", "models", "ggml-base.en.bin"),
      language: "en",
      threads: 4
    };
  }
  validateWhisperFiles() {
    const config = this.getWhisperConfig();
    const errors = [];
    if (!existsSync(config.binPath)) {
      errors.push(`Whisper executable not found at: ${config.binPath}`);
      errors.push("Please place whisper-cli.exe in whisper/bin/ directory");
    }
    if (!existsSync(config.modelPath)) {
      errors.push(`Whisper model not found at: ${config.modelPath}`);
      errors.push("Please place ggml-base.en.bin in whisper/models/ directory");
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
  getTempWavPath(sessionId) {
    const tempDir = join(app.getPath("userData"), "tmp");
    return join(tempDir, `${sessionId}.wav`);
  }
}
class WavWriter {
  static writePCM16(filePath, pcmData, sampleRate = 16e3) {
    mkdirSync(dirname(filePath), { recursive: true });
    const int16Data = new Int16Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      const sample = Math.max(-1, Math.min(1, pcmData[i]));
      int16Data[i] = sample < 0 ? sample * 32768 : sample * 32767;
    }
    const channels = 1;
    const bitsPerSample = 16;
    const blockAlign = channels * bitsPerSample / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = int16Data.length * 2;
    const fileSize = 44 + dataSize;
    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    writeString(0, "RIFF");
    view.setUint32(4, fileSize - 8, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, "data");
    view.setUint32(40, dataSize, true);
    for (let i = 0; i < int16Data.length; i++) {
      view.setInt16(44 + i * 2, int16Data[i], true);
    }
    writeFileSync(filePath, Buffer.from(buffer));
  }
}
class WhisperService {
  constructor() {
    __publicField(this, "configService");
    this.configService = new ConfigService();
  }
  async transcribeFromPCM(pcmData, sessionId) {
    const validation = this.configService.validateWhisperFiles();
    if (!validation.valid) {
      throw new Error(validation.errors.join("\n"));
    }
    const config = this.configService.getWhisperConfig();
    const tempWavPath = this.configService.getTempWavPath(sessionId);
    try {
      WavWriter.writePCM16(tempWavPath, pcmData, 16e3);
      const result = await this.runWhisper(tempWavPath, config);
      return result;
    } finally {
      try {
        if (existsSync(tempWavPath)) unlinkSync(tempWavPath);
      } catch (error) {
        console.warn("Failed to clean up temporary WAV file:", error);
      }
    }
  }
  runWhisper(wavPath, config) {
    return new Promise((resolve, reject) => {
      var _a, _b;
      const args = [
        "-m",
        config.modelPath,
        "-f",
        wavPath,
        "--language",
        config.language,
        "--no-timestamps",
        "--print-special",
        "false",
        "--suppress-nst",
        "--temperature",
        "0.0",
        "--best-of",
        "1",
        "--beam-size",
        "1",
        "--word-thold",
        "0.01",
        "--threads",
        config.threads.toString()
      ];
      console.log("Running whisper with args:", args);
      const whisperProcess = spawn(config.binPath, args, {
        stdio: ["pipe", "pipe", "pipe"],
        cwd: process.cwd()
        // Set working directory to project root
      });
      let stdout = "";
      let stderr = "";
      (_a = whisperProcess.stdout) == null ? void 0 : _a.on("data", (data) => {
        stdout += data.toString();
      });
      (_b = whisperProcess.stderr) == null ? void 0 : _b.on("data", (data) => {
        stderr += data.toString();
      });
      whisperProcess.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Whisper process failed with code ${code}
Stderr: ${stderr}
Stdout: ${stdout}`));
          return;
        }
        try {
          const cleanText = stdout.replace(/<\|endoftext\|>/g, "").replace(/\s+/g, " ").trim();
          resolve({
            text: cleanText,
            confidence: void 0,
            duration: void 0
          });
        } catch (error) {
          reject(new Error(`Failed to parse transcription result: ${error}`));
        }
      });
      whisperProcess.on("error", (error) => {
        reject(new Error(`Failed to start whisper process: ${error.message}`));
      });
      setTimeout(() => {
        if (!whisperProcess.killed) {
          whisperProcess.kill();
          reject(new Error("Whisper transcription timed out after 60 seconds"));
        }
      }, 6e4);
    });
  }
  validatePrerequisites() {
    return this.configService.validateWhisperFiles();
  }
}
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
const whisperService = new WhisperService();
const configService = new ConfigService();
let win;
ipcMain.on("recording:start", () => {
  console.log("Recording started");
});
ipcMain.handle("recording:stop", async (_, pcmF32Buf) => {
  try {
    console.log("Recording stopped, processing audio...");
    const pcmF32 = new Float32Array(pcmF32Buf);
    const sessionId = `session_${Date.now()}`;
    const result = await whisperService.transcribeFromPCM(pcmF32, sessionId);
    win == null ? void 0 : win.webContents.send("stt:final", result.text);
    return result;
  } catch (error) {
    console.error("Transcription failed:", error);
    win == null ? void 0 : win.webContents.send("stt:error", error.message || "Transcription failed");
    throw error;
  }
});
function createWindow() {
  const isDev = process.env.NODE_ENV === "development";
  win = new BrowserWindow({
    width: isDev ? 500 : 300,
    height: isDev ? 400 : 200,
    frame: isDev,
    // Show frame in dev for easier debugging
    transparent: !isDev,
    // Only transparent in production
    alwaysOnTop: true,
    resizable: isDev,
    // Allow resizing in dev
    skipTaskbar: !isDev,
    // Show in taskbar during dev
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.setAlwaysOnTop(true, "screen-saver");
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
    validateWhisperOnReady();
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
function validateWhisperOnReady() {
  const validation = configService.validateWhisperFiles();
  if (!validation.valid) {
    console.error("Whisper validation failed:", validation.errors);
    win == null ? void 0 : win.webContents.send("stt:error", validation.errors.join("\n"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
