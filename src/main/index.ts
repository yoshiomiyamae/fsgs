import {
  BrowserWindow,
  Menu,
  MenuItemConstructorOptions,
  app,
  dialog,
  ipcMain,
} from 'electron';
import {
  IpcMainInvokeEvent,
  MessageBoxOptions,
  Rectangle,
} from 'electron/main';
import { fileTypeFromBuffer } from 'file-type';
import { existsSync, promises, readdirSync } from 'fs';
import log4js from 'log4js';
import path from 'path';
import ts, { ModuleKind, ScriptTarget } from 'typescript';
import { ParameterSet } from '../renderer/models/fsgs-model';
import { getResourceDirectory, isDevelopmentMode } from './config';
import { GetScriptArgs } from './model';
import { FagParser } from './parser';
import { getSaves, load, save } from './save-data';

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

process.on('uncaughtException', (err, origin) => {
  logger.error(err, origin);
});
process.on('unhandledRejection', (err, origin) => {
  logger.error(err, origin);
});

export const logger = log4js.getLogger();
const rendererLogger = log4js.getLogger('rendererLog');

let currentMenuTemplate: MenuItemConstructorOptions[] = [];

const findMenuTemplateItem = (keys: string[]) =>
  (
    (
      currentMenuTemplate.find((m1) => m1.id === keys[0])
        ?.submenu as MenuItemConstructorOptions[]
    ).find((m2) => m2.id === keys[1])?.submenu as MenuItemConstructorOptions[]
  ).find((m3) => m3.id === keys[2]);

const renameMenuTemplateItem = (keys: string[], label: string) => {
  const menuItem = findMenuTemplateItem(keys);
  if (!menuItem) {
    return;
  }
  menuItem.label = label;
};

const changeEnableMenuTemplateItem = (keys: string[], enabled: boolean) => {
  const menuItem = findMenuTemplateItem(keys);
  if (!menuItem) {
    return;
  }
  menuItem.enabled = enabled;
};

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 640,
    height: 480,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.resolve(getResourceDirectory(), 'preload.js'),
    },
  });
  mainWindow.loadFile(path.join(getResourceDirectory(), 'index.html'));

  currentMenuTemplate = createMenuTemplate(mainWindow);
  if (process.platform === 'darwin') {
    currentMenuTemplate.unshift(menuItemForDarwin);
  }
  if (isDevelopmentMode) {
    currentMenuTemplate.push(createDebugMenuItemTemplate(mainWindow));
  }
  const saves = await getSaves();
  saves.forEach((s, i) => {
    const n = i + 1;
    renameMenuTemplateItem(
      ['saveload', 'save', `save_${n}`],
      s.params.alias || s.params.name
    );
    renameMenuTemplateItem(
      ['saveload', 'load', `load_${n}`],
      s.params.alias || s.params.name
    );
    changeEnableMenuTemplateItem(['saveload', 'load', `load_${n}`], true);
  });
  const menu = Menu.buildFromTemplate(currentMenuTemplate);
  Menu.setApplicationMenu(menu);

  if (isDevelopmentMode) {
    mainWindow.maximize();
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

const createMenuTemplate = (
  window: BrowserWindow
): MenuItemConstructorOptions[] => [
  {
    label: 'システム(&S)',
    submenu: [
      { label: 'メッセージを消す(&S)' },
      { label: 'メッセージ履歴の表示(&H)' },
      { label: '次の選択肢/未読まで進む(&F)' },
      { label: '自動的に読み進む(&A)' },
      {
        label: '自動的に読み進むウェイト(&D)',
        submenu: [
          { label: '短い(&1)' },
          { label: 'やや短い(&2)' },
          { label: '普通(&3)' },
          { label: 'やや長い(&4)' },
          { label: '長い(&5)' },
        ],
      },
      { type: 'separator' },
      {
        label: '前に戻る(&B)',
        click: () => window.webContents.send('menu-clicked', 'go-back'),
      },
      {
        label: '最初に戻る(&R)',
        click: () => window.webContents.send('menu-clicked', 'go-to-start'),
      },
      { type: 'separator' },
      {
        label: '終了(&X)',
        click: () => {
          window.webContents.send('menu-clicked', 'exit');
        },
      },
    ],
  },
  {
    label: '栞(&B)',
    id: 'saveload',
    submenu: [
      {
        label: '栞をはさむ(&S)',
        id: 'save',
        submenu: [
          {
            label: '栞1',
            id: 'save_1',
            click: () => window.webContents.send('menu-clicked', 'save', 1),
          },
          {
            label: '栞2',
            id: 'save_2',
            click: () => window.webContents.send('menu-clicked', 'save', 2),
          },
          {
            label: '栞3',
            id: 'save_3',
            click: () => window.webContents.send('menu-clicked', 'save', 3),
          },
          {
            label: '栞4',
            id: 'save_4',
            click: () => window.webContents.send('menu-clicked', 'save', 4),
          },
          {
            label: '栞5',
            id: 'save_5',
            click: () => window.webContents.send('menu-clicked', 'save', 5),
          },
          {
            label: '栞6',
            id: 'save_6',
            click: () => window.webContents.send('menu-clicked', 'save', 6),
          },
          {
            label: '栞7',
            id: 'save_7',
            click: () => window.webContents.send('menu-clicked', 'save', 7),
          },
          {
            label: '栞8',
            id: 'save_8',
            click: () => window.webContents.send('menu-clicked', 'save', 8),
          },
          {
            label: '栞9',
            id: 'save_9',
            click: () => window.webContents.send('menu-clicked', 'save', 9),
          },
          {
            label: '栞10',
            id: 'save_10',
            click: () => window.webContents.send('menu-clicked', 'save', 10),
          },
        ],
      },
      {
        label: '栞をたどる(&L)',
        id: 'load',
        submenu: [
          {
            label: '栞1',
            id: 'load_1',
            click: () => window.webContents.send('menu-clicked', 'load', 1),
            enabled: false,
          },
          {
            label: '栞2',
            id: 'load_2',
            click: () => window.webContents.send('menu-clicked', 'load', 2),
            enabled: false,
          },
          {
            label: '栞3',
            id: 'load_3',
            click: () => window.webContents.send('menu-clicked', 'load', 3),
            enabled: false,
          },
          {
            label: '栞4',
            id: 'load_4',
            click: () => window.webContents.send('menu-clicked', 'load', 4),
            enabled: false,
          },
          {
            label: '栞5',
            id: 'load_5',
            click: () => window.webContents.send('menu-clicked', 'load', 5),
            enabled: false,
          },
          {
            label: '栞6',
            id: 'load_6',
            click: () => window.webContents.send('menu-clicked', 'load', 6),
            enabled: false,
          },
          {
            label: '栞7',
            id: 'load_7',
            click: () => window.webContents.send('menu-clicked', 'load', 7),
            enabled: false,
          },
          {
            label: '栞8',
            id: 'load_8',
            click: () => window.webContents.send('menu-clicked', 'load', 8),
            enabled: false,
          },
          {
            label: '栞9',
            id: 'load_9',
            click: () => window.webContents.send('menu-clicked', 'load', 9),
            enabled: false,
          },
          {
            label: '栞10',
            id: 'load_10',
            click: () => window.webContents.send('menu-clicked', 'load', 10),
            enabled: false,
          },
        ],
      },
    ],
  },
];

const menuItemForDarwin: MenuItemConstructorOptions = {
  label: app.getName(),
  submenu: [{ role: 'quit' }],
};

const createDebugMenuItemTemplate = (
  window: BrowserWindow
): MenuItemConstructorOptions => ({
  label: 'デバッグ(&D)',
  submenu: [
    {
      label: '開発者ツールの表示(&D)',
      click: () => window.webContents.openDevTools(),
    },
    {
      label: 'リロード(&R)',
      click: () => window.reload(),
    },
  ],
});

app.once('ready', createWindow);

app.once('window-all-closed', () => {
  process.platform !== 'darwin' && app.quit();
});

export const dataToUrl = (data: Buffer, mime: string) => {
  const base64data = data.toString('base64');
  return `data:${mime};base64,${base64data}`;
};

ipcMain.handle(
  'get-script',
  async (event: IpcMainInvokeEvent, args: GetScriptArgs) => {
    logger.info(`get-script(${args.scriptName}) called.`);
    const data = await promises.readFile(
      path.join(getResourceDirectory(), 'data', 'scenario', args.scriptName),
      'utf8'
    );
    return {
      script: FagParser.parse(data),
      filePath: args.scriptName,
      startFrom: args.startFrom,
    };
  }
);

const getFilePathes = (directoryPath: string) =>
  readdirSync(directoryPath, { withFileTypes: true })
    .filter((f) => f.isFile())
    .map((f) => path.join(directoryPath, f.name));

const searchImage = (fileName: string) => {
  const dataDirectoryPath = path.join(getResourceDirectory(), 'data');
  const bgimagePath = path.join(dataDirectoryPath, 'bgimage');
  const fgimagePath = path.join(dataDirectoryPath, 'fgimage');
  const imagePath = path.join(dataDirectoryPath, 'image');
  const imageFiles = [
    ...(existsSync(bgimagePath) ? getFilePathes(bgimagePath) : []),
    ...(existsSync(fgimagePath) ? getFilePathes(fgimagePath) : []),
    ...(existsSync(imagePath) ? getFilePathes(imagePath) : []),
  ];
  const candidates = imageFiles.filter((f) => f.endsWith(fileName));
  if (candidates.length >= 1) {
    return candidates[0];
  }
  return null;
};

ipcMain.handle(
  'get-image',
  async (event: IpcMainInvokeEvent, filePath: string) => {
    logger.info(`get-image(${filePath}) called.`);
    const fileName = path.basename(filePath);
    let loadFilePath =
      fileName === filePath
        ? searchImage(fileName)
        : path.join(getResourceDirectory(), 'data', filePath);
    if (loadFilePath === null) {
      return null;
    }
    const data = await promises.readFile(loadFilePath);
    const ft = await fileTypeFromBuffer(data);
    if (!ft) {
      return null;
    }
    return dataToUrl(data, ft.mime);
  }
);

ipcMain.handle(
  'do-rule-transition',
  async (event: IpcMainInvokeEvent, fileName: string) => {
    logger.info(`do-rule-transition(${fileName}) called.`);
    const data = await promises.readFile(
      path.join(getResourceDirectory(), 'data', 'rule', fileName)
    );
    const ft = await fileTypeFromBuffer(data);
    if (!ft) {
      return null;
    }
    return dataToUrl(data, ft.mime);
  }
);

ipcMain.handle(
  'get-audio',
  async (event: IpcMainInvokeEvent, filePath: string) => {
    logger.info(`get-audio(${filePath}) called.`);
    const data = await promises.readFile(
      path.join(getResourceDirectory(), 'data', filePath)
    );
    const ft = await fileTypeFromBuffer(data);
    if (!ft) {
      return null;
    }
    return dataToUrl(data, ft.mime);
  }
);

ipcMain.handle('get-config', async (event: IpcMainInvokeEvent) => {
  logger.info(`get-config called.`);
  const data = await promises.readFile(
    path.join(getResourceDirectory(), 'data', 'system', 'config.ts')
  );
  const script = data.toString();
  const transpiledScript = ts.transpile(script, {
    target: ScriptTarget.ES2020,
    module: ModuleKind.CommonJS,
  });
  const config = eval(transpiledScript);
  return config;
});

ipcMain.handle('window-get-bounds', async (event: IpcMainInvokeEvent) => {
  if (!mainWindow) {
    return <Rectangle>{ height: 0, width: 0, x: 0, y: 0 };
  }
  return mainWindow.getBounds();
});
ipcMain.handle(
  'window-set-bounds',
  async (event: IpcMainInvokeEvent, bounds: Rectangle) => {
    if (!mainWindow) {
      return;
    }
    mainWindow.setBounds(bounds);
  }
);
ipcMain.handle(
  'window-set-full-screen',
  async (event: IpcMainInvokeEvent, isFullScreen: boolean) => {
    if (!mainWindow) {
      return;
    }
    mainWindow.setMenuBarVisibility(isFullScreen);
    mainWindow.setFullScreen(!isFullScreen);
  }
);
ipcMain.handle('window-get-full-screen', async (event: IpcMainInvokeEvent) => {
  if (!mainWindow) {
    return;
  }
  return mainWindow.isFullScreen();
});
ipcMain.handle(
  'window-set-menu-bar-visibility',
  async (event: IpcMainInvokeEvent, visible: boolean) => {
    if (!mainWindow) {
      return;
    }
    mainWindow.setMenuBarVisibility(visible);
  }
);
ipcMain.handle(
  'window-get-menu-bar-visibility',
  async (event: IpcMainInvokeEvent) => {
    if (!mainWindow) {
      return;
    }
    return mainWindow.isMenuBarVisible();
  }
);
ipcMain.handle(
  'window-dialog-show-message-box',
  async (event: IpcMainInvokeEvent, options: MessageBoxOptions) =>
    await dialog.showMessageBox(options)
);
ipcMain.handle(
  'window-set-title',
  (event: IpcMainInvokeEvent, title: string) => {
    if (!mainWindow) {
      return;
    }
    mainWindow.setTitle(title);
  }
);

ipcMain.handle(
  'save',
  async (event: IpcMainInvokeEvent, n: number, params: ParameterSet, f: {}) => {
    logger.debug('Save parameters', params);
    logger.debug('Save variables', f);
    renameMenuTemplateItem(
      ['saveload', 'save', `save_${n}`],
      params.alias || params.name
    );
    renameMenuTemplateItem(
      ['saveload', 'load', `load_${n}`],
      params.alias || params.name
    );
    changeEnableMenuTemplateItem(['saveload', 'load', `load_${n}`], true);
    const menu = Menu.buildFromTemplate(currentMenuTemplate);
    mainWindow?.removeMenu();
    mainWindow?.setMenu(menu);

    await save(n, params, f);
  }
);

ipcMain.handle(
  'load',
  async (
    event: IpcMainInvokeEvent,
    n: number
  ): Promise<{ params: ParameterSet; f: {} }> => {
    logger.debug('Load', n);
    const { params, f } = await load(n);
    logger.debug('Load parameters', params);
    logger.debug('Load variables', f);

    return { params, f };
  }
);

ipcMain.handle(
  'logger-trace',
  (event: IpcMainInvokeEvent, message: any, ...args: any[]) =>
    rendererLogger.trace(message, ...args)
);
ipcMain.handle(
  'logger-debug',
  (event: IpcMainInvokeEvent, message: any, ...args: any[]) =>
    rendererLogger.debug(message, ...args)
);
ipcMain.handle(
  'logger-info',
  (event: IpcMainInvokeEvent, message: any, ...args: any[]) =>
    rendererLogger.info(message, ...args)
);
ipcMain.handle(
  'logger-warn',
  (event: IpcMainInvokeEvent, message: any, ...args: any[]) =>
    rendererLogger.warn(message, ...args)
);
ipcMain.handle(
  'logger-error',
  (event: IpcMainInvokeEvent, message: any, ...args: any[]) =>
    rendererLogger.error(message, ...args)
);
ipcMain.handle(
  'logger-fatal',
  (event: IpcMainInvokeEvent, message: any, ...args: any[]) =>
    rendererLogger.fatal(message, ...args)
);
ipcMain.handle(
  'logger-mark',
  (event: IpcMainInvokeEvent, message: any, ...args: any[]) =>
    rendererLogger.mark(message, ...args)
);
