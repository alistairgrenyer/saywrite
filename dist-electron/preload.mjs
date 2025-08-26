"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
  // You can expose other APTs you need here.
  // ...
});
electron.contextBridge.exposeInMainWorld("app", {
  startRecording() {
    electron.ipcRenderer.send("recording:start");
  },
  stopRecording(pcmData) {
    return electron.ipcRenderer.invoke("recording:stop", pcmData.buffer);
  },
  onFinal(callback) {
    electron.ipcRenderer.on("stt:final", (_, text) => callback(text));
  },
  onSTTError(callback) {
    electron.ipcRenderer.on("stt:error", (_, error) => callback(error));
  }
});
