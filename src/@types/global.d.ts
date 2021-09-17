import {
  ipcRenderer,
  MessageBoxOptions,
  MessageBoxReturnValue,
  Rectangle,
  remote,
} from "electron";
import { Config } from "../renderer/models/fsgs-model";
import { GetScriptArgs } from "./main/model";
import { SetScriptArgs } from "./renderer/models/fsgs-model";

declare global {
  interface Window {
    api: {
      getScript: (args: GetScriptArgs) => Promise<SetScriptArgs>;
      getImage: (filePath: string) => Promise<string>;
      getAudio: (filePath: string) => Promise<string>;
      getConfig: () => Promise<Config>;
      doRuleTransition: (fileName: string) => Promise<string>;
      onMenuClicked: (listner: (...args: any[]) => void) => IpcRenderer;
      window: {
        getBounds: () => Promise<Rectangle>;
        setBounds: (bounds: Rectangle) => Promise<void>;
        setFullScreen: (isFullScreen: boolean) => Promise<void>;
        isFullScreen: () => Promise<boolean>;
        setMenuBarVisibility: (visible: boolean) => Promise<void>;
        isMenuBarVisible: () => Promise<boolean>;
        dialog: {
          showMessageBox: (
            options: MessageBoxOptions
          ) => Promise<MessageBoxReturnValue>;
        };
        setTitle: (title: string) => Promise<any>;
      };
      logger: {
        trace: (message: any, ...args: any[]) => Promise<void>;
        debug: (message: any, ...args: any[]) => Promise<void>;
        info: (message: any, ...args: any[]) => Promise<void>;
        warn: (message: any, ...args: any[]) => Promise<void>;
        error: (message: any, ...args: any[]) => Promise<void>;
        fatal: (message: any, ...args: any[]) => Promise<void>;
        mark: (message: any, ...args: any[]) => Promise<void>;
      };
      shell: Electron.Shell;
    };
  }
}
