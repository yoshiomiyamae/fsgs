import {
  BrowserWindow,
  app,
  ipcMain,
  Event,
  Menu,
  MenuItemConstructorOptions,
  dialog,
} from "electron";
import * as path from "path";
import * as url from "url";
import { FagParser } from "./parser";
import { promises } from "fs";
import * as fileType from "file-type";
import {
  GetImageArgs,
  GetAudioArgs,
  DoRuleTransitionArgs,
  GetScriptArgs,
} from "./model";
import { IpcMainInvokeEvent, MessageBoxOptions, Rectangle } from "electron/main";

let mainWindow: BrowserWindow | null;

const getResourceDirectory = () => {
  return process.env.NODE_ENV === "development"
    ? path.join(process.cwd(), "build")
    : path.join(process.resourcesPath, "app.asar", "build");
};

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
          console.log(window.webContents);
          window.webContents.send("menu-clicked", "exit");
        },
      },
    ],
  },
  ...process.env.NODE_ENV === "development" ? [{
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
    console.log(`get-script(${args.scriptName}) called.`);
    const data = await promises.readFile(
      path.join(getResourceDirectory(), "data", "scenario", args.scriptName),
      "utf8"
    );
    return {
      script: FagParser.parse(data),
      filePath: args.scriptName,
      startFrom: args.startFrom,
      offset: args.offset,
    };
  }
);

ipcMain.handle(
  "get-image",
  async (event: IpcMainInvokeEvent, filePath: string) => {
    console.log(`get-image(${filePath}) called.`);
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

ipcMain.handle(
  "do-rule-transition",
  async (event: IpcMainInvokeEvent, fileName: string) => {
    console.log(`do-rule-transition(${fileName}) called.`);
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
    console.log(`get-audio(${filePath}) called.`);
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
ipcMain.handle("window-dialog-show-message-box", async (event: IpcMainInvokeEvent, options: MessageBoxOptions) => {
  return dialog.showMessageBox(options);
});
ipcMain.handle("window-set-title", (event: IpcMainInvokeEvent, title: string) => {
  if (!mainWindow) {
    return;
  }
  mainWindow.setTitle(title);
})