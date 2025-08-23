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
  async login(request) {
    try {
      await electron.ipcRenderer.invoke("api:login", request);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message || "Login failed" };
    }
  },
  async logout() {
    return electron.ipcRenderer.invoke("api:logout");
  },
  async getAuthState() {
    return electron.ipcRenderer.invoke("api:getAuthState");
  },
  async rewrite(request) {
    return electron.ipcRenderer.invoke("api:rewrite", request);
  },
  onAuthExpired(callback) {
    electron.ipcRenderer.on("auth:expired", callback);
  },
  removeAuthExpiredListener(callback) {
    electron.ipcRenderer.removeListener("auth:expired", callback);
  }
});
