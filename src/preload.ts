import {
  contextBridge,
  IpcRenderer,
  ipcRenderer,
  MessageBoxOptions,
  MessageBoxReturnValue,
  Rectangle,
  shell,
} from "electron";
import { GetScriptArgs } from "./main/model";
import {
  Config,
  ParameterSet,
  SetScriptArgs,
} from "./renderer/models/fsgs-model";
contextBridge.exposeInMainWorld("api", {
  getScript: async (args: GetScriptArgs): Promise<SetScriptArgs> =>
    ipcRenderer.invoke("get-script", args),
  getImage: async (filePath: string): Promise<string> =>
    ipcRenderer.invoke("get-image", filePath),
  getAudio: async (filePath: string): Promise<string> =>
    ipcRenderer.invoke("get-audio", filePath),
  getConfig: async (): Promise<Config> => ipcRenderer.invoke("get-config"),
  doRuleTransition: async (fileName: string): Promise<string> =>
    ipcRenderer.invoke("do-rule-transition", fileName),
  onMenuClicked: (
    func: (action: string, ...params: any[]) => void
  ): IpcRenderer =>
    ipcRenderer.on("menu-clicked", (e, ...args) =>
      func(args[0], args.slice(1))
    ),
  save: (n: number, params: ParameterSet) =>
    ipcRenderer.invoke("save", n, params),
  load: (n: number) => ipcRenderer.invoke("load", n),
  window: {
    getBounds: (): Promise<Rectangle> =>
      ipcRenderer.invoke("window-get-bounds"),
    setBounds: (bounds: Rectangle): Promise<void> =>
      ipcRenderer.invoke("window-set-bounds", bounds),
    setFullScreen: (isFullScreen: boolean): Promise<void> =>
      ipcRenderer.invoke("window-set-full-screen", isFullScreen),
    isFullScreen: (): Promise<boolean> =>
      ipcRenderer.invoke("window-get-full-screen"),
    setMenuBarVisibility: (visible: boolean): Promise<void> =>
      ipcRenderer.invoke("window-set-menu-bar-visibility", visible),
    isMenuBarVisible: (): Promise<boolean> =>
      ipcRenderer.invoke("window-get-menu-bar-visibility"),
    dialog: {
      showMessageBox: async (
        options: MessageBoxOptions
      ): Promise<MessageBoxReturnValue> =>
        ipcRenderer.invoke("window-dialog-show-message-box", options),
    },
    setTitle: (title: string): Promise<any> =>
      ipcRenderer.invoke("window-set-title", title),
  },
  logger: {
    trace: (message: any, ...args: any[]): Promise<void> =>
      ipcRenderer.invoke("logger-trace", message, ...args),
    debug: (message: any, ...args: any[]): Promise<void> =>
      ipcRenderer.invoke("logger-debug", message, ...args),
    info: (message: any, ...args: any[]): Promise<void> =>
      ipcRenderer.invoke("logger-info", message, ...args),
    warn: (message: any, ...args: any[]): Promise<void> =>
      ipcRenderer.invoke("logger-warn", message, ...args),
    error: (message: any, ...args: any[]): Promise<void> =>
      ipcRenderer.invoke("logger-error", message, ...args),
    fatal: (message: any, ...args: any[]): Promise<void> =>
      ipcRenderer.invoke("logger-fatal", message, ...args),
    mark: (message: any, ...args: any[]): Promise<void> =>
      ipcRenderer.invoke("logger-mark", message, ...args),
  },
  shell,
});
