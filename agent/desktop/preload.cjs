const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("easyPrint", {
  getConfig: () => ipcRenderer.invoke("config:get"),
  saveConfig: (config) => ipcRenderer.invoke("config:save", config),
  confirmCash: (orderId) => ipcRenderer.invoke("agent:confirm-cash", orderId),
  generateQr: (url) => ipcRenderer.invoke("qr:generate", url),
  openUrl: (url) => ipcRenderer.invoke("open:url", url),
  onAgentEvent: (callback) => ipcRenderer.on("agent:event", (_event, data) => callback(data)),
});
