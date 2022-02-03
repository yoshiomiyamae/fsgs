import {
  BrowserWindow,
  app,
  ipcMain,
  Menu,
  MenuItemConstructorOptions,
  dialog,
} from "electron";
import path from "path";
import { FagParser } from "./parser";
import { readdirSync, existsSync, promises } from "fs";
import fileType from "file-type";
import {
  GetScriptArgs,
} from "./model";
import { IpcMainEvent, IpcMainInvokeEvent, MessageBoxOptions, Rectangle } from "electron/main";
import ts, { ModuleKind, ScriptTarget } from "typescript";
import log4js, { levels } from 'log4js';
import { ParameterSet } from "../renderer/models/fsgs-model";
import { getResourceDirectory, isDevelopmentMode } from "./config";
import { load, save } from "./save-data";

let mainWindow: BrowserWindow | null;

const logLevel = isDevelopmentMode ? 'debug' : 'error';
log4js.configure({
  appenders: {
    standardOut: { type: 'stdout' },
    mainLog: { type: 'file', filename: 'main.log' },
    rendererLog: { type: 'file', filename: 'renderer.log' },
  },
  categories: {
    default: { appenders: ['standardOut', 'mainLog'], level: logLevel },
    rendererLog: { appenders: ['standardOut', 'rendererLog'], level: logLevel },
  },
});

const logger = log4js.getLogger();
const rendererLogger = log4js.getLogger('rendererLog');

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 100,
    height: 100,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.resolve(getResourceDirectory(), "preload.js"),
    },
  });
  mainWindow.loadFile(path.join(getResourceDirectory(), "index.html"));

  const menuTemplate = createMenuTemplate(mainWindow);

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  if (isDevelopmentMode) {
    mainWindow.maximize();
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

const createMenuTemplate = (
  window: BrowserWindow
): MenuItemConstructorOptions[] => [
    ...(process.platform === "darwin"
      ? ([
        {
          label: app.getName(),
          submenu: [{ role: "quit" }],
        },
      ] as MenuItemConstructorOptions[])
      : ([] as MenuItemConstructorOptions[])),
    {
      label: "システム(&S)",
      submenu: [
        { label: "メッセージを消す(&S)" },
        { label: "メッセージ履歴の表示(&H)" },
        { label: "次の選択肢/未読まで進む(&F)" },
        { label: "自動的に読み進む(&A)" },
        {
          label: "自動的に読み進むウェイト(&D)",
          submenu: [
            { label: "短い(&1)" },
            { label: "やや短い(&2)" },
            { label: "普通(&3)" },
            { label: "やや長い(&4)" },
            { label: "長い(&5)" },
          ],
        },
        { type: "separator" },
        {
          label: "前に戻る(&B)",
          click: () => window.webContents.send("menu-clicked", "go-back"),
        },
        {
          label: "最初に戻る(&R)",
          click: () => window.webContents.send("menu-clicked", "go-to-start"),
        },
        { type: "separator" },
        {
          label: "終了(&X)",
          click: () => {
            window.webContents.send("menu-clicked", "exit");
          },
        },
      ],
    },
    {
      label: "栞(&B)",
      submenu: [
        {
          label: "栞をはさむ(&S)",
          submenu: [
            {
              label: "栞1",
              click: () => window.webContents.send("menu-clicked", "save", 1),
            },
            {
              label: "栞2",
              click: () => window.webContents.send("menu-clicked", "save", 2),
            },
            {
              label: "栞3",
              click: () => window.webContents.send("menu-clicked", "save", 3),
            },
            {
              label: "栞4",
              click: () => window.webContents.send("menu-clicked", "save", 4),
            },
            {
              label: "栞5",
              click: () => window.webContents.send("menu-clicked", "save", 5),
            },
            {
              label: "栞6",
              click: () => window.webContents.send("menu-clicked", "save", 6),
            },
            {
              label: "栞7",
              click: () => window.webContents.send("menu-clicked", "save", 7),
            },
            {
              label: "栞8",
              click: () => window.webContents.send("menu-clicked", "save", 8),
            },
            {
              label: "栞9",
              click: () => window.webContents.send("menu-clicked", "save", 9),
            },
            {
              label: "栞10",
              click: () => window.webContents.send("menu-clicked", "save", 10),
            },
          ]
        },
        {
          label: "栞をたどる(&L)",
          submenu: [
            {
              label: "栞1",
              click: () => window.webContents.send("menu-clicked", "load", 1),
            },
            {
              label: "栞2",
              click: () => window.webContents.send("menu-clicked", "load", 2),
            },
            {
              label: "栞3",
              click: () => window.webContents.send("menu-clicked", "load", 3),
            },
            {
              label: "栞4",
              click: () => window.webContents.send("menu-clicked", "load", 4),
            },
            {
              label: "栞5",
              click: () => window.webContents.send("menu-clicked", "load", 5),
            },
            {
              label: "栞6",
              click: () => window.webContents.send("menu-clicked", "load", 6),
            },
            {
              label: "栞7",
              click: () => window.webContents.send("menu-clicked", "load", 7),
            },
            {
              label: "栞8",
              click: () => window.webContents.send("menu-clicked", "load", 8),
            },
            {
              label: "栞9",
              click: () => window.webContents.send("menu-clicked", "load", 9),
            },
            {
              label: "栞10",
              click: () => window.webContents.send("menu-clicked", "load", 10),
            },
          ]
        },
      ],
    },
    ...isDevelopmentMode ? [{
      label: "デバッグ(&D)",
      submenu: [
        {
          label: "開発者ツールの表示(&D)",
          click: () => window.webContents.openDevTools(),
        },
        {
          label: "リロード(&R)",
          click: () => window.reload(),
        },
      ],
    }] : [],
  ];

app.once("ready", createWindow);

app.once("window-all-closed", () => {
  process.platform !== "darwin" && app.quit();
});

export const dataToUrl = (data: Buffer, mime: string) => {
  const base64data = data.toString("base64");
  return `data:${mime};base64,${base64data}`;
};

ipcMain.handle(
  "get-script",
  async (event: IpcMainInvokeEvent, args: GetScriptArgs) => {
    logger.info(`get-script(${args.scriptName}) called.`);
    const data = await promises.readFile(
      path.join(getResourceDirectory(), "data", "scenario", args.scriptName),
      "utf8"
    );
    return {
      script: FagParser.parse(data),
      filePath: args.scriptName,
      startFrom: args.startFrom,
    };
  }
);

const getFilePathes = (directoryPath: string) => readdirSync(directoryPath, { withFileTypes: true })
  .filter(f => f.isFile())
  .map(f => path.join(directoryPath, f.name))

const searchImage = (fileName: string) => {
  const dataDirectoryPath = path.join(getResourceDirectory(), "data");
  const bgimagePath = path.join(dataDirectoryPath, 'bgimage');
  const fgimagePath = path.join(dataDirectoryPath, 'fgimage');
  const imagePath = path.join(dataDirectoryPath, 'image');
  const imageFiles = [
    ...(existsSync(bgimagePath) ? getFilePathes(bgimagePath) : []),
    ...(existsSync(fgimagePath) ? getFilePathes(fgimagePath) : []),
    ...(existsSync(imagePath) ? getFilePathes(imagePath) : []),
  ]
  const candidates = imageFiles.filter(f => f.endsWith(fileName));
  if (candidates.length >= 1) {
    return candidates[0];
  }
  return null;
}

ipcMain.handle(
  "get-image",
  async (event: IpcMainInvokeEvent, filePath: string) => {
    logger.info(`get-image(${filePath}) called.`);
    const fileName = path.basename(filePath);
    let loadFilePath = fileName === filePath ? searchImage(fileName) : path.join(getResourceDirectory(), "data", filePath);
    if (loadFilePath === null) {
      return null;
    }
    const data = await promises.readFile(loadFilePath);
    const ft = await fileType.fromBuffer(data);
    if (!ft) {
      return null;
    }
    return dataToUrl(data, ft.mime);
  }
);

ipcMain.handle(
  "do-rule-transition",
  async (event: IpcMainInvokeEvent, fileName: string) => {
    logger.info(`do-rule-transition(${fileName}) called.`);
    const data = await promises.readFile(
      path.join(getResourceDirectory(), "data", "rule", fileName)
    );
    const ft = await fileType.fromBuffer(data);
    if (!ft) {
      return null;
    }
    return dataToUrl(data, ft.mime);
  }
);

ipcMain.handle(
  "get-audio",
  async (event: IpcMainInvokeEvent, filePath: string) => {
    logger.info(`get-audio(${filePath}) called.`);
    const data = await promises.readFile(
      path.join(getResourceDirectory(), "data", filePath)
    );
    const ft = await fileType.fromBuffer(data);
    if (!ft) {
      return null;
    }
    return dataToUrl(data, ft.mime);
  }
);

ipcMain.handle("get-config", async (event: IpcMainInvokeEvent) => {
  logger.info(`get-config called.`);
  const data = await promises.readFile(
    path.join(getResourceDirectory(), "data", "system", "config.ts")
  );
  const script = data.toString();
  const transpiledScript = ts.transpile(script, { target: ScriptTarget.ES2020, module: ModuleKind.CommonJS });
  const config = eval(transpiledScript);
  return config;
});

ipcMain.handle("window-get-bounds", async (event: IpcMainInvokeEvent) => {
  if (!mainWindow) {
    return <Rectangle>{ height: 0, width: 0, x: 0, y: 0 };
  }
  return mainWindow.getBounds();
});
ipcMain.handle("window-set-bounds", async (event: IpcMainInvokeEvent, bounds: Rectangle) => {
  if (!mainWindow) {
    return;
  }
  mainWindow.setBounds(bounds);
});
ipcMain.handle("window-set-full-screen", async (event: IpcMainInvokeEvent, isFullScreen: boolean) => {
  if (!mainWindow) {
    return;
  }
  mainWindow.setMenuBarVisibility(isFullScreen);
  mainWindow.setFullScreen(!isFullScreen);
});
ipcMain.handle("window-get-full-screen", async (event: IpcMainInvokeEvent) => {
  if (!mainWindow) {
    return;
  }
  return mainWindow.isFullScreen();
});
ipcMain.handle("window-set-menu-bar-visibility", async (event: IpcMainInvokeEvent, visible: boolean) => {
  if (!mainWindow) {
    return;
  }
  mainWindow.setMenuBarVisibility(visible);
});
ipcMain.handle("window-get-menu-bar-visibility", async (event: IpcMainInvokeEvent) => {
  if (!mainWindow) {
    return;
  }
  return mainWindow.isMenuBarVisible();
});
ipcMain.handle("window-dialog-show-message-box", async (event: IpcMainInvokeEvent, options: MessageBoxOptions) => dialog.showMessageBox(options));
ipcMain.handle("window-set-title", (event: IpcMainInvokeEvent, title: string) => {
  if (!mainWindow) {
    return;
  }
  mainWindow.setTitle(title);
});

ipcMain.handle("save", async (event: IpcMainInvokeEvent, n: number, params: ParameterSet, f: {}) => {
  logger.debug('Save', n, params.storage, params.labelName, params.alias, f);
  await save(n, params, f);
});

ipcMain.handle("load", async (event: IpcMainInvokeEvent, n: number): Promise<{params: ParameterSet, f: {}}> => {
  logger.debug('Load', n);
  return await load(n);
});

ipcMain.handle('logger-trace', (event: IpcMainInvokeEvent, message: any, ...args: any[]) =>
  rendererLogger.trace(message, ...args));
ipcMain.handle('logger-debug', (event: IpcMainInvokeEvent, message: any, ...args: any[]) =>
  rendererLogger.debug(message, ...args));
ipcMain.handle('logger-info', (event: IpcMainInvokeEvent, message: any, ...args: any[]) =>
  rendererLogger.info(message, ...args));
ipcMain.handle('logger-warn', (event: IpcMainInvokeEvent, message: any, ...args: any[]) =>
  rendererLogger.warn(message, ...args));
ipcMain.handle('logger-error', (event: IpcMainInvokeEvent, message: any, ...args: any[]) =>
  rendererLogger.error(message, ...args));
ipcMain.handle('logger-fatal', (event: IpcMainInvokeEvent, message: any, ...args: any[]) =>
  rendererLogger.fatal(message, ...args));
ipcMain.handle('logger-mark', (event: IpcMainInvokeEvent, message: any, ...args: any[]) =>
  rendererLogger.mark(message, ...args));