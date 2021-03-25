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
import { SetScriptArgs } from "./renderer/models/fsgs-model";
contextBridge.exposeInMainWorld("api", {
  getScript: async (args: GetScriptArgs): Promise<SetScriptArgs> =>
    ipcRenderer.invoke("get-script", args),
  getImage: async (filePath: string): Promise<string> =>
    ipcRenderer.invoke("get-image", filePath),
  getAudio: async (filePath: string): Promise<string> =>
    ipcRenderer.invoke("get-audio", filePath),
  doRuleTransition: async (fileName: string): Promise<string> =>
    ipcRenderer.invoke("do-rule-transition", fileName),
  onMenuClicked: (func: (action: string) => void): IpcRenderer =>
    ipcRenderer.on("menu-clicked", (e, ...args) => func(args[0])),
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
  },
  shell,
});
