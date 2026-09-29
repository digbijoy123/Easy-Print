import { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage } from "electron";
import path from "node:path";
import fs from "node:fs";
import QRCode from "qrcode";
import { startAgent } from "../service.js";

const userConfig = path.join(app.getPath("userData"), "easyprint.json");
let config = null;
let stopAgent = null;
let win = null;
let tray = null;

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(userConfig, "utf8")); } catch { return null; }
}
function saveConfig(next) {
  fs.mkdirSync(path.dirname(userConfig), { recursive: true });
  fs.writeFileSync(userConfig, JSON.stringify(next, null, 2), "utf8");
  config = next;
}
function startBackgroundAgent() {
  if (!config || stopAgent) return;
  stopAgent = startAgent(config, (event) => {
    if (win && !win.isDestroyed()) win.webContents.send("agent:event", event);
  });
}
function createWindow() {
  win = new BrowserWindow({
    width: 1050, height: 720, minWidth: 850, minHeight: 600,
    webPreferences: { preload: path.join(app.getAppPath(), "desktop/preload.js"), contextIsolation: true, nodeIntegration: false }
  });
  win.loadFile(path.join(app.getAppPath(), "desktop/index.html"));
  win.on("close", (event) => { if (!app.isQuiting) { event.preventDefault(); win.hide(); } });
}
ipcMain.handle("config:get", () => config);
ipcMain.handle("config:save", (_event, next) => { saveConfig(next); startBackgroundAgent(); return config; });
ipcMain.handle("qr:generate", async (_event, url) => QRCode.toDataURL(url, { margin: 2, width: 320 }));
ipcMain.handle("open:url", (_event, url) => shell.openExternal(url));

app.whenReady().then(() => {
  config = loadConfig();
  tray = new Tray(nativeImage.createEmpty());
  tray.setToolTip("Easy Print");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Open Easy Print", click: () => { win?.show(); win?.focus(); } },
    { type: "separator" },
    { label: "Quit", click: () => { app.isQuiting = true; app.quit(); } }
  ]));
  createWindow();
  startBackgroundAgent();
});
app.on("window-all-closed", (event) => event.preventDefault());
