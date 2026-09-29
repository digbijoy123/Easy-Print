import { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage } from "electron";
import path from "node:path";
import fs from "node:fs";
import QRCode from "qrcode";
import { startAgent } from "../service.js";

const userConfig = path.join(app.getPath("userData"), "easyprint.json");
let config = null;
let agentController = null;
let win = null;
let tray = null;

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(userConfig, "utf8")); } catch { return null; }
}
function saveConfig(next) {
  next.output = next.output && next.output !== "./virtual-printer-output"
    ? next.output
    : path.join(app.getPath("userData"), "virtual-printer-output");
  fs.mkdirSync(path.dirname(userConfig), { recursive: true });
  fs.writeFileSync(userConfig, JSON.stringify(next, null, 2), "utf8");
  config = next;
}
function startBackgroundAgent() {
  if (!config || agentController) return;
  agentController = startAgent(config, (event) => {
    if (win && !win.isDestroyed()) win.webContents.send("agent:event", event);
  });
}
ipcMain.handle("config:get", () => config);
ipcMain.handle("config:save", (_event, next) => {
  saveConfig(next);
  startBackgroundAgent();
  return config;
});
ipcMain.handle("agent:confirm-cash", async (_event, orderId) => {
  if (!agentController?.confirmCash) throw new Error("Easy Print agent is not running.");
  await agentController.confirmCash(String(orderId));
  return { ok: true };
});
ipcMain.handle("qr:generate", async (_event, url) => QRCode.toDataURL(url, { margin: 2, width: 320 }));
ipcMain.handle("open:url", (_event, url) => shell.openExternal(url));

app.whenReady().then(() => {
  app.setLoginItemSettings({ openAtLogin: true });
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

function createWindow() {
  win = new BrowserWindow({
    width: 1050, height: 720, minWidth: 850, minHeight: 600,
    webPreferences: {
      preload: path.join(app.getAppPath(), "desktop/preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile(path.join(app.getAppPath(), "desktop/index.html"));
  win.on("close", (event) => {
    if (!app.isQuiting) { event.preventDefault(); win.hide(); }
  });
}

app.on("window-all-closed", (event) => event.preventDefault());
