import {
  ipcRenderer,
  MessageBoxOptions,
  MessageBoxReturnValue,
  Rectangle,
  remote,
} from "electron";
import { GetScriptArgs } from "./main/model";
import { SetScriptArgs } from "./renderer/models/fsgs-model";

declare global {
  interface Window {
    api: {
      getScript: (args: GetScriptArgs) => Promise<SetScriptArgs>;
      getImage: (filePath: string) => Promise<string>;
      getAudio: (filePath: string) => Promise<string>;
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
      };
      shell: Electron.Shell;
    };
  }
}
