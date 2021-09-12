import * as React from "react";
import {
  Operation,
  Script,
  Config,
  ParameterSet,
  SetImageArgs,
  Position,
  LayerNumber,
  SetScriptArgs,
  StackItem,
  LayerTypes,
  SetButtonArgs,
  ParameterSetCollection,
} from "../models/fsgs-model";
import {
  MessageLayer,
  MessageLayerCollection,
} from "../components/message-layer";
import { ImageLayer, ImageLayerCollection } from "../components/image-layer";
import common, { sleep, nullFallback } from "../common";
import { messageLayerConfigDefault } from "../configs/config";
import ts, { ScriptTarget } from "typescript";
import "../style.css";

export let fag: Fsgs;
let fsgs: Fsgs;
let mp: {};

let f = {};
let sf = {};
const tf = {};
export const g = {};
export const c = {};

export const str2num = common.str2Num;
export const random = common.random;
export const intrandom = common.intRandom;

const styles = {
  mainWindow: {
    position: "relative",
  } as React.CSSProperties,
};

export interface FsgsProps {
  updateCanvas?: (context: CanvasRenderingContext2D) => void;
}

export class Fsgs extends React.Component<FsgsProps> {
  private programCounter: number;
  private baseLayer: ImageLayer | null;
  private messageLayers: MessageLayerCollection;
  private characterLayers: ImageLayerCollection;
  private _messageLayers: JSX.Element[];
  private _characterLayers: JSX.Element[];
  private timer: NodeJS.Timer | null;
  private processing: boolean;
  private clickWaiting: boolean;
  private clickWaitingL: boolean;
  private clickWaitingP: boolean;
  private clickWaitingS: boolean;
  private stack: StackItem[];
  private macroStack: ParameterSetCollection;
  private macroParams: ParameterSet | null;
  private linkParams: ParameterSet | null;
  private currentMousePosition: Position;
  private dom: HTMLDivElement | null;
  private offset: Position;
  private audio: HTMLAudioElement | null;
  private currentMessageLayer: number;
  private startAnchorEnabled: boolean;
  private startAnchorLabel: Operation;
  private previousLabel: Operation;
  private latestLabel: Operation;
  private currentScriptName: string;
  private transitionWaiting: boolean;
  private ignoreIf: boolean;
  private script: Script;
  private labelStore: {
    [labelName: string]: {
      storage: string;
      index: number;
    };
  };
  private macroStore: {
    [macroName: string]: {
      storage: string;
      index: number;
    };
  };
  private isPausing: boolean;
  private isHistoryRecording: boolean;
  private isHistoryEnabled: boolean;
  private isSaveEnabled: boolean;
  private isLoadEnabled: boolean;
  private config: Config;

  constructor(props: FsgsProps) {
    super(props);

    this.programCounter = 0;
    this.baseLayer = null;
    this.messageLayers = [];
    this.characterLayers = [];
    this._messageLayers = [];
    this._characterLayers = [];
    this.timer = null;
    this.processing = false;
    this.clickWaiting = false;
    this.clickWaitingL = false;
    this.clickWaitingP = false;
    this.clickWaitingS = false;
    this.stack = [];
    this.macroStack = [];
    this.macroParams = null;
    this.linkParams = null;
    this.currentMousePosition = {
      x: 0,
      y: 0,
    };
    this.dom = null;
    this.offset = {
      x: 0,
      y: 0,
    };
    this.audio = null;
    this.currentMessageLayer = 0;
    this.startAnchorEnabled = true;
    this.startAnchorLabel = this.previousLabel = this.latestLabel = {
      action: "label",
      params: {},
    };
    this.currentScriptName = "";
    this.transitionWaiting = false;
    this.ignoreIf = false;
    this.script = {
      labelIndices: {},
      macroIndices: {},
      scenario: [],
    };
    this.labelStore = {};
    this.macroStore = {};
    this.isPausing = false;
    this.isHistoryRecording = true;
    this.isHistoryEnabled = true;
    this.isSaveEnabled = true;
    this.isLoadEnabled = true;
    this.config = {};
  }

  initialize = async () => {
    fag = fsgs = this;

    document.onkeydown = this.onKeydown;

    const config = await window.api.getConfig();
    console.log(config);
    this.config = config;
    await window.api.window.setTitle(this.config.title || 'FSGS');

    await window.api.onMenuClicked(async (action: string) => {
      switch (action) {
        case "go-to-start": {
          await this.goToStart();
          break;
        }
        case "go-back": {
          await this.goBack();
          break;
        }
        case "exit": {
          await this.shutdown();
          break;
        }
      }
    });
  };

  private getScWidth = () =>
    nullFallback(this.config.windowConfig?.scWidth, 640);
  private getScHeight = () =>
    nullFallback(this.config.windowConfig?.scHeight, 480);
  private getChSpeedNormal = () =>
    nullFallback(this.config.windowConfig?.chSpeeds?.normal, 30);
  private getMessageLayerConfig = () =>
    nullFallback(
      this.config.messageLayerConfig,
      messageLayerConfigDefault
    );

  async componentDidMount() {
    await this.initialize();
    this.messageLayers = [];
    this.characterLayers = [];
    this._characterLayers = [];
    if (this.config.windowConfig) {
      if (this.config.windowConfig.numCharacterLayers) {
        for (
          let i = 0;
          i < this.config.windowConfig.numCharacterLayers;
          i++
        ) {
          this._characterLayers.push(
            <ImageLayer
              key={`character-layer-${i}`}
              ref={(e) => {
                this.characterLayers.push(e);
              }}
              visible={false}
              width={this.getScWidth()}
              height={this.getScHeight()}
            />
          );
        }
      }
      this._messageLayers = [];
      if (
        this.config.windowConfig.numMessageLayers &&
        this.config.windowConfig.chSpeeds
      ) {
        for (
          let i = 0;
          i < this.config.windowConfig.numMessageLayers;
          i++
        ) {
          this._messageLayers.push(
            <MessageLayer
              key={`"message-layer-${i}"`}
              ref={(e) => {
                this.messageLayers.push(e);
              }}
              speed={this.getChSpeedNormal()}
              width={this.getScWidth()}
              height={this.getScHeight()}
              config={this.getMessageLayerConfig()}
              visible={i === 0}
            />
          );
        }
      }
    }
    this.stack = [];
    this.loadScript("first.ks", 0);

    const windowBounds = await window.api.window.getBounds();
    console.log(
      `offsetWidth: ${document.body.offsetWidth}, offsetHight: ${document.body.offsetHeight}`
    );
    const horizontalMargin = windowBounds.width - document.body.offsetWidth;
    const verticalMargin = windowBounds.height - document.body.offsetHeight;
    console.log(
      `horizontalMargin: ${horizontalMargin}, verticalMargin: ${verticalMargin}`
    );
    const height = verticalMargin + this.getScHeight();
    const width = horizontalMargin + this.getScWidth();
    console.log(
      `scWidth: ${this.getScWidth()}, scHeight: ${this.getScHeight()}`
    );
    const x = Math.round((window.screen.width - width) / 2);
    const y = Math.round((window.screen.height - height) / 2);
    window.api.window.setBounds({ height, width, x, y });
    this.programCounter = 0;
    if (this.dom) {
      this.audio = new Audio();
      this.dom.appendChild(this.audio);
    }
    this.timer = setInterval(async () => {
      if (!this.processing) {
        // console.log("----- Update Frame Start -----");
        await this.updateCanvas();
        // console.log("------ Update Frame End ------");
      }
    }, 1000 / 120);

    this.setState({});
  }

  updateCanvas = async () => {
    if (this.isPausing){
      return;
    }
    if (this.dom) {
      const baseLayerSize = this.baseLayer?.getSize();
      if (baseLayerSize?.height === document.body.clientHeight) {
        this.offset.x = (document.body.clientWidth - baseLayerSize.width) / 2;
        this.offset.y = 0;
      } else if (baseLayerSize?.width === document.body.clientWidth) {
        this.offset.x = 0;
        this.offset.y = (document.body.clientHeight - baseLayerSize.height) / 2;
      } else {
        this.offset.x = 0;
        this.offset.y = 0;
      }
      this.dom.style.left = `${this.offset.x}px`;
      this.dom.style.top = `${this.offset.y}px`;
    }
    this.baseLayer?.update();
    for (const characterLayer of this.characterLayers) {
      characterLayer?.update();
    }
    for (const messageLayer of this.messageLayers) {
      if (messageLayer) {
        messageLayer.setClickWaiting(this.clickWaiting);
        messageLayer.update();
        if (messageLayer.getVisible()) {
          this.clickWaiting = messageLayer.isTextRemaining();
        }
      }
    }
    this.transitionWaiting =
      this.baseLayer?.getTransitionWorking() ||
      this.characterLayers
        .map((characterLayer) => characterLayer?.getTransitionWorking())
        .reduce(
          (previousValue, currentValue) => previousValue || currentValue,
          false
        ) ||
      this.messageLayers
        .map((messageLayer) => messageLayer?.getTransitionWorking())
        .reduce(
          (previousValue, currentValue) => previousValue || currentValue,
          false
        ) ||
      false;
    if (this.script.scenario) {
      this.processing = true;
      if (this.script.scenario.length <= this.programCounter) {
        this.processing = false;
        return;
      }
      if (
        !this.transitionWaiting &&
        !this.clickWaiting &&
        !this.clickWaitingL &&
        !this.clickWaitingP &&
        !this.clickWaitingS
      ) {
        const operation = this.script.scenario[this.programCounter];
        await this.operate(operation);
        this.programCounter++;
      }
      this.processing = false;
    }
  };

  parseLayerNumber = (messageLayerName: string | number): LayerNumber => {
    const result = parseInt(`${messageLayerName}`);
    if (!isNaN(result)) {
      return {
        type: LayerTypes.Character,
        number: result,
      };
    }
    if (messageLayerName === "base") {
      return {
        type: LayerTypes.Base,
        number: parseInt(`${messageLayerName}`.substring(7)),
      };
    } else {
      return {
        type: LayerTypes.Message,
        number: parseInt(`${messageLayerName}`.substring(7)),
      };
    }
  };

  goToStart = async () =>
    await this.jump(
      this.startAnchorLabel.params.storage,
      `*${this.startAnchorLabel.params.name}`
    );
  goBack = async () =>
    await this.jump(
      this.previousLabel.params.storage,
      `*${this.previousLabel.params.name}`
    );
  loadScript = async (
    scriptName: string,
    startFrom: string | number
  ) => {
    // console.log ("Load script called")
    const data: SetScriptArgs = await window.api.getScript({
      scriptName,
      startFrom,
    });

    console.log("script", data.script);
    this.currentScriptName = data.filePath;
    this.script = data.script;
    if (this.script) {
      for (const labelName in this.script.labelIndices) {
        if (this.script) {
          this.labelStore[labelName] = {
            storage: data.filePath,
            index: this.script.labelIndices[labelName],
          };
        }
      }
      for (const macroName in this.script.macroIndices) {
        if (this.script) {
          this.macroStore[macroName] = {
            storage: data.filePath,
            index: this.script.macroIndices[macroName],
          };
        }
      }
    }

    // console.log(`Script: ${scriptName} Loaded.`)
    await this.jump(null, data.startFrom);
  };

  setButton = async (args: SetButtonArgs) => {
    const image = new Image();
    image.src = args.image as string;
    image.onload = async () => {
      const messageLayer = this.messageLayers[
        this.currentMessageLayer
      ];
      args.image = image;
      console.log(`Set button current message layer: ${this.currentMessageLayer}`);
      console.log(messageLayer);
      messageLayer?.setButton(args);
    }
  }

  setImage = async (args: SetImageArgs) => {
    const image = new Image();
    image.src = args.data;
    image.onload = async () => {
      switch (args.layer) {
        case "base": {
          if (!args.page) {
            throw "page must be specified.";
          }
          this.baseLayer?.setImage(image, args.page);
          break;
        }
        case "graph": {
          const messageLayer = this.messageLayers[this.currentMessageLayer];
          await messageLayer?.writeGraph(image);
          break;
        }
        case "message": {
          const messageLayer = this.messageLayers[
            args.layerNumber || this.currentMessageLayer
          ];
          messageLayer?.setFrame(image);
          break;
        }
        default: {
          if (args.layerNumber === null || args.layerNumber === undefined) {
            throw "layerNumber must be specified.";
          }
          const characterLayer = this.characterLayers[args.layerNumber];
          if (characterLayer) {
            if (args.page) {
              characterLayer.setImage(image, args.page);
            }
            if (args.left) {
              characterLayer.setLeft(args.left);
            }
            if (args.top) {
              characterLayer.setTop(args.top);
            }
          }
          break;
        }
      }
    };
  };

  operate = async (operation: Operation) => {
    if (
      "inherit_macro_params" in operation.params &&
      operation.params.inherit_macro_params === true
    ) {
      operation.params = {
        ...operation.params,
        ...this.macroParams,
      };
    }
    
    for (const key in operation.params) {
      const values = `${operation.params[key]}`.split("|");
      // console.log("param before: %j", JSON.stringify(operation.params)`);
      operation.params[key] = values.reduce((previousValue, currentValue) => {
        if (previousValue) {
          return previousValue;
        } else if (currentValue[0] === "%") {
          return (
            (this.macroParams && this.macroParams[currentValue.substring(1)]) ||
            ""
          );
        } else if (currentValue) {
          return currentValue;
        }
        return "";
      }, "");
      // console.log("param after: %j", JSON.stringify(operation.params)`);
    }
    if (this.ignoreIf && ['elseif', 'endif'].indexOf(operation.action) === -1) {
      // console.log(`Ignore if: ${this.ignoreIf}, action: ${operation.action}`);
      return;
    }
    if (operation.params.cond && !this.eval(operation.params.cond)){
      return;
    }
    console.log(operation);
    switch (operation.action) {
      case "ch": {
        this.ch(operation.params.text);
        break;
      }
      case "cm": {
        this.cm();
        break;
      }
      case "image": {
        await this.image(operation.params);
        break;
      }
      case "l": {
        this.l();
        break;
      }
      case "r": {
        this.r();
        break;
      }
      case "p": {
        this.p();
        break;
      }
      case "wait": {
        await this.wait(+operation.params.time);
        break;
      }
      case "text": {
        this.text(operation.params.text);
        break;
      }
      case "return": {
        await this.return();
        break;
      }
      case "endmacro": {
        await this.endmacro();
        break;
      }
      case "macro": {
        this.macro();
        break;
      }
      case "font": {
        this.font(operation.params);
        break;
      }
      case "resetfont": {
        this.resetfont();
        break;
      }
      case "resetstyle": {
        this.resetstyle();
        break;
      }
      case "style": {
        this.style(operation.params.align);
        break;
      }
      case "graph": {
        await this.graph(operation.params.storage);
        break;
      }
      case "eval": {
        this.eval(operation.params.exp);
        break;
      }
      case "s": {
        this.s();
        break;
      }
      case "link": {
        this.link(operation.params);
        break;
      }
      case "endlink": {
        await this.endlink();
        break;
      }
      case "label": {
        this.label(operation);
        break;
      }
      case "jump": {
        await this.jump(
          operation.params.storage,
          operation.params.target
        );
        break;
      }
      case "edit": {
        this.edit(operation.params);
        break;
      }
      case "emb": {
        this.emb(operation.params.exp);
        break;
      }
      case "nowait": {
        this.nowait();
        break;
      }
      case "endnowait": {
        this.endnowait();
        break;
      }
      case "layopt": {
        this.layopt(operation.params);
        break;
      }
      case "ruby": {
        this.ruby(operation.params.text);
        break;
      }
      case "position": {
        await this.position(operation.params);
        break;
      }
      case "playbgm": {
        await this.playbgm(operation.params);
        break;
      }
      case "stopbgm": {
        this.stopbgm();
        break;
      }
      case "current": {
        this.current(operation.params);
        break;
      }
      case "startanchor": {
        this.startanchor(operation.params.enabled);
        break;
      }
      case "record": {
        this.record();
        break;
      }
      case "goback": {
        this.goBack();
        break;
      }
      case "gotostart": {
        await this.goToStart();
        break;
      }
      case "backlay": {
        this.backlay(operation.params);
        break;
      }
      case "trans": {
        await this.trans(operation.params);
        break;
      }
      case "wt": {
        this.wt();
        break;
      }
      case "if":
      case "elseif": {
        this.if(operation.params.exp);
        break;
      }
      case "endif": {
        this.endif();
        break;
      }
      case "call": {
        await this.call(operation.params);
        break;
      }
      case "inlineScript": {
        this.eval(operation.params.script);
        break;
      }
      case "title": {
        window.api.window.setTitle(operation.params.name);
        break;
      }
      case "commit": {
        break;
      }
      case "clearvar": {
        this.clearvar();
        break;
      }
      case "clearsysvar": {
        this.clearsysvar();
        break;
      }
      case "store": {
        this.store(operation.params.enabled);
        break;
      }
      case "history": {
        this.history(operation.params);
        break;
      }
      case "delay": {
        this.delay(operation.params.speed);
        break;
      }
      case "locate": {
        this.locate(operation.params);
        break;
      }
      case "button": {
        await this.button(operation.params);
        break;
      }
      case "close": {
        await this.shutdown();
        break;
      }
      default: {
        await this.default(operation);
        break;
      }
    }
  };

  shutdown = async () => {
    this.isPausing = true;
    const {
      response,
      checkboxChecked,
    } = await window.api.window.dialog.showMessageBox({
      type: "info",
      message: "終了しますか？",
      detail: "セーブされていない変更は破棄されます",
      buttons: ["OK", "キャンセル"],
      noLink: true,
    });
    if (response === 0) {
      window.close();
    }
    this.isPausing = false;
  };

  getCanvasPosition = (pagePosition: Position) => {
    const baseLayerSize = this.baseLayer?.getSize();
    if (!baseLayerSize) {
      return {
        x: 0,
        y: 0,
      } as Position;
    }
    const width = this.getScWidth();
    const height = this.getScHeight();
    const canvasPosition: Position = {
      x: (pagePosition.x / baseLayerSize.width) * width,
      y: (pagePosition.y / baseLayerSize.height) * height,
    };

    return canvasPosition;
  };

  getProgramCounter = (target: string | number) => {
    if (typeof target === "string") {
      const label = this.labelStore[target.substr(1)];
      if (label) {
        return label.index;
      }
    } else if (typeof target === "number") {
      return target;
    }
    return 0;
  };

  jump = async (
    storage: string | null,
    target?: string | number | null
  ) => {
    // console.log("Jump called");
    console.log(
      `storage: ${storage}, target: ${target}, currentScript: ${this.currentScriptName}, currentPC: ${this.programCounter}`
    );
    if (storage && (target === null || target === undefined)) {
      if (storage !== this.currentScriptName) {
        await this.loadScript(storage, 0);
      } else {
        // console.log("Jump to first.");
        this.programCounter = 0;
      }
    } else if (storage && target !== null && target !== undefined) {
      if (storage !== this.currentScriptName) {
        await this.loadScript(storage, target);
      } else {
        const programCounter = this.getProgramCounter(target);
        // console.log(`Jump to ${target} (${programCounter}) of script ${storage}`);
        this.programCounter = programCounter;
      }
    } else if (!storage && target !== null && target !== undefined) {
      const programCounter = this.getProgramCounter(target);
      // console.log(`Jump to ${target} (${programCounter})`);
      this.programCounter = programCounter;
    } else {
      // console.log("Jump to first.");
      this.programCounter = 0;
    }
    this.clickWaiting = false;
    this.clickWaitingL = false;
    this.clickWaitingS = false;
    this.clickWaitingP = false;
    // console.log("Jump end");
  };

  eval = (script?: string) => {
    if (!script) {
      return null;
    }
    try {
      const transpiledScript = ts.transpile(script, {target: ScriptTarget.ES2020});
      console.log(`eval(${transpiledScript})`);
      const result = eval(transpiledScript);
      console.log("result", result);
      return result;
    } catch (e) {
      console.log(e);
    }
  };

  private onKeydown = async (e: KeyboardEvent) => {
    if(this.isPausing){
      return;
    }
    switch (e.code) {
      case "Enter": {
        if (e.altKey) {
          const isFullScreen = await window.api.window.isFullScreen();
          await window.api.window.setFullScreen(isFullScreen);
        } else {
          await this.click();
        }
        return;
      }
      case "Escape": {
        const visible = await window.api.window.isMenuBarVisible();
        await window.api.window.setMenuBarVisibility(!visible);
        return;
      }
      case "ArrowUp": {
        const messageLayer = this.messageLayers[this.currentMessageLayer];
        if (!messageLayer) {
          return;
        }
        this.currentMousePosition = messageLayer.getPreviousChoicePosition(
          this.currentMousePosition
        );
        messageLayer.setCursorPosition(this.currentMousePosition);
        return;
      }
      case "ArrowDown": {
        const messageLayer = this.messageLayers[this.currentMessageLayer];
        if (!messageLayer) {
          return;
        }
        this.currentMousePosition = messageLayer.getNextChoicePosition(
          this.currentMousePosition
        );
        messageLayer.setCursorPosition(this.currentMousePosition);
        return;
      }
    }
  };

  private click = async () => {
    if (this.clickWaitingP) {
      for (const messageLayer of this.messageLayers) {
        messageLayer?.clear();
      }
    }
    if (this.clickWaitingS) {
      for (const messageLayer of this.messageLayers) {
        const linkParams = messageLayer?.click();
        if (linkParams) {
          linkParams.exp && this.eval(linkParams.exp);
          await this.jump(linkParams.storage, linkParams.target);
        }
      }
    }
    this.clickWaiting = false;
    this.clickWaitingL = false;
    this.clickWaitingP = false;
  };

  backlay = (params: ParameterSet) => {
    if (!params.layer) {
      return;
    }
    const layerNumber = this.parseLayerNumber(params.layer);
    const layer =
      layerNumber.type === LayerTypes.Base
        ? this.baseLayer
        : layerNumber.type === LayerTypes.Message
        ? this.messageLayers[layerNumber.number]
        : this.characterLayers[layerNumber.number];
    layer?.copyForeToBack();
  };

  ch = (text: string) => {
    const messageLayer = this.messageLayers[this.currentMessageLayer];
    messageLayer?.setText(text);
  };

  cm = () => {
    for (const messageLayer of this.messageLayers) {
      messageLayer?.clear();
    }
  };

  image = async (params: ParameterSet) => {
    switch (params.layer) {
      case "base": {
        if (params.visible) {
            this.baseLayer?.setVisible(params.visible === "true");
        }
        const data = await window.api.getImage(`${params.storage}`);
        await this.setImage({
          data,
          layer: params.layer,
          page: params.page,
        });
        return;
      }
      default: {
        const layerNumber = +params.layer;
        if (params.visible) {
          const characterLayer = this.characterLayers[layerNumber];
          characterLayer?.setVisible(params.visible === "true");
        }
        const data = await window.api.getImage(`${params.storage}`);
        await this.setImage({
          data,
          layer: params.layer,
          page: params.page,
          layerNumber,
          left: params.left,
          top: params.top,
        });
        return;
      }
    }
  };

  l = () => {
    this.clickWaitingL = true;
  };

  r = () => {
    for (const messageLayer of this.messageLayers) {
      messageLayer?.addCarriageReturn();
    }
  };

  p = () => {
    this.clickWaitingP = true;
  };

  wait = async (time: number) => {
    await sleep(time);
  };

  text = (text: string) => {
    console.log(text);
    if (this.linkParams) {
      this.linkParams.text = text;
    } else {
      const messageLayer = this.messageLayers[this.currentMessageLayer];
      messageLayer?.setText(text);
      this.clickWaiting = true;
    }
  };

  return = async () => {
    const stackItem = this.stack.pop();
    if (stackItem) {
      await this.jump(stackItem.scriptName, stackItem.programCounter);
    }
  };

  endmacro = async () => {
    // this.ignoreIf = false;
    const macroStackItem = this.macroStack.pop();
    const stackItem = this.stack.pop();
    if (macroStackItem) {
      console.log("Macro stack item: %j", macroStackItem);
      this.macroParams = macroStackItem;
    }
    if (stackItem) {
      await this.jump(stackItem.scriptName, stackItem.programCounter);
    }
  };

  macro = () => {
    // this.ignoreIf = false;
    if (this.script) {
      while (this.script.scenario[++this.programCounter].action !== "endmacro");
    }
  };

  font = (params: ParameterSet) => {
    if (params.color) {
      for (const messageLayer of this.messageLayers) {
        messageLayer?.setFontColor(params.color);
      }
    }
    if (params.size) {
      for (const messageLayer of this.messageLayers) {
        messageLayer?.setFontSize(params.size);
      }
    }
    if (params.edge) {
      for (const messageLayer of this.messageLayers) {
        messageLayer?.setFontEdge(params.edge);
      }
    }
    if (params.edgecolor) {
      for (const messageLayer of this.messageLayers) {
        messageLayer?.setFontEdgeColor(params.edgecolor);
      }
    }
    if (params.shadow) {
      for (const messageLayer of this.messageLayers) {
        messageLayer?.setFontShadow(params.shadow);
      }
    }
  };

  resetfont = () => {
    for (const messageLayer of this.messageLayers) {
      messageLayer?.resetFont();
    }
  };

  resetstyle = () => {
    for (const messageLayer of this.messageLayers) {
      messageLayer?.resetAlignment();
    }
  };

  style = (align: string) => {
    if (align) {
      for (const messageLayer of this.messageLayers) {
        messageLayer?.setAlignment(align);
      }
    }
  };

  graph = async (storage: string) => {
    const data = await window.api.getImage(`${storage}`);
    await this.setImage({
      data,
      layer: "graph",
    });
  };

  s = () => {
    this.clickWaitingS = true;
  };

  link = (params: ParameterSet) => {
    this.linkParams = params;
  };

  endlink = async () => {
    if (!this.linkParams) {
      return;
    }
    const messageLayer = this.messageLayers[this.currentMessageLayer];
    await messageLayer?.setLink(this.linkParams);
    this.linkParams = null;
  };

  label = (operation: Operation) => {
    console.log(`Label: ${operation.params.name} (${operation.params.alias}) passed.`)
    this.latestLabel = operation;
  };

  edit = (params: ParameterSet) => {
    const messageLayer = this.messageLayers[this.currentMessageLayer];
    messageLayer?.setEdit(params, (value: string) => {
      eval(`${params.name} = '${value}'`);
    });
  };

  emb = (exp: string) => {
    const text = `${eval(exp)}`;
    const messageLayer = this.messageLayers[this.currentMessageLayer];
    messageLayer?.setText(text);
    this.clickWaiting = true;
  };

  nowait = () => {
    for (const messageLayer of this.messageLayers) {
      messageLayer?.setNoWait(true);
    }
  };

  endnowait = () => {
    for (const messageLayer of this.messageLayers) {
      messageLayer?.setNoWait(false);
    }
  };

  layopt = (params: ParameterSet) => {
    if (params.layer === null || params === undefined) {
      return;
    }
    const layerName = this.parseLayerNumber(params.layer);
    const layer =
      layerName.type === LayerTypes.Message
        ? this.messageLayers[layerName.number]
        : this.characterLayers[layerName.number];
    if (layer) {
      if (params.visible) {
        layer.setVisible(params.visible === "true");
      }
      if (params.opacity) {
        layer.setOpacity(parseInt(params.opacity) / 0xff);
      }
      if (
        params.page &&
        !(layerName.type === LayerTypes.Message && isNaN(layerName.number))
      ) {
      }
    }
  };

  ruby = (text: string) => {
    if (!text) {
      return;
    }
    const messageLayer = this.messageLayers[this.currentMessageLayer];
    messageLayer?.setRuby(text);
  };

  convertMessageLayerNumberToInt = (messageLayerNumber: string) => {
    const offset = messageLayerNumber.indexOf('message') + 7;
    return parseInt(messageLayerNumber.substr(offset));
  }

  position = async (params: ParameterSet) => {
    let messageLayerNumber = 0;
    let messageLayer: MessageLayer | null = null;
    if (params.layer){
      messageLayerNumber = this.convertMessageLayerNumberToInt(params.layer);
      console.log(`Message Layer Number: ${messageLayerNumber}`);
      messageLayer = this.messageLayers[messageLayerNumber];
    } else {
      messageLayer = this.messageLayers[this.currentMessageLayer];
    }
    
    if (!messageLayer) {
      return;
    }
    if (!!params.frame) {
      const data = await window.api.getImage(`${params.frame}`);
      await this.setImage({
        data,
        layer: "message",
        layerNumber: messageLayerNumber,
      });
    }
    params.vertical && messageLayer.setVertical(params.vertical === "true");
    params.left && messageLayer.setLeft(parseInt(params.left));
    params.top && messageLayer.setTop(parseInt(params.top));
    params.marginl && messageLayer.setMarginL(parseInt(params.marginl));
    params.margint && messageLayer.setMarginT(parseInt(params.margint));
    params.marginr && messageLayer.setMarginR(parseInt(params.marginr));
    params.marginb && messageLayer.setMarginB(parseInt(params.marginb));
    params.visible && messageLayer.setVisible(params.visible === "true");
    messageLayer.clear();
  };

  playbgm = async (params: ParameterSet) => {
    const data = await window.api.getAudio(`bgm/${params.storage}`);
    if (!this.audio) {
      return;
    }
    this.audio.preload = "none";
    this.audio.src = data;
    this.audio.loop = params.loop === "true";
    this.audio.play();
  };

  stopbgm = () => {
    this.audio?.pause();
  };

  current = (params: ParameterSet) => {
    if (!params.layer) {
      return;
    }
    this.currentMessageLayer = this.parseLayerNumber(params.layer).number;
    const messageLayer = this.messageLayers[this.currentMessageLayer];
    if (messageLayer) {
      messageLayer.setCurrentPage(params.page || "fore");
    }
  };

  startanchor = (enabled: boolean) => {
    this.startAnchorEnabled = enabled || true;
    if (this.startAnchorEnabled) {
      this.startAnchorLabel = this.latestLabel;
    }
  };

  record = () => {
    this.previousLabel = this.latestLabel;
  };

  transBaseLayerUniversal = (params: ParameterSet, rule: HTMLImageElement) => [this.baseLayer]
    .filter(layer => layer !== null)
    .map(layer => layer!.transition(
      "universal",
      params.time,
      {
        rule: rule,
        vague: params.vague,
      }
    ));
  transMessageLayerUniversal = (params: ParameterSet, rule: HTMLImageElement) => this.messageLayers
    .filter(layer => layer !== null)
    .map(layer => layer!.transition(
      "universal",
      params.time,
      {
        rule: rule,
        vague: params.vague,
      }
    ));
  transCharacterLayerUniversal = (params: ParameterSet, rule: HTMLImageElement) => this.characterLayers
    .filter(layer => layer !== null)
    .map(layer => layer!.transition(
      "universal",
      params.time,
      {
        rule: rule,
        vague: params.vague,
      }
    ));
  transBaseLayer = (params: ParameterSet) => [this.baseLayer]
    .filter(layer => layer !== null)
    .map(layer => layer!.transition(params.method, parseInt(params.time), {
      from: params.from,
      stay: params.stay,
    }));
  transMessageLayer = (params: ParameterSet) => this.messageLayers
    .filter(layer => layer !== null)
    .map(layer => layer!.transition(params.method, parseInt(params.time), {
      from: params.from,
      stay: params.stay,
    }));
  transCharacterLayer = (params: ParameterSet) => this.characterLayers
    .filter(layer => layer !== null)
    .map(layer => layer!.transition(params.method, parseInt(params.time), {
      from: params.from,
      stay: params.stay,
    }));

  trans = async (params: ParameterSet) => {
    const layerNumber = this.parseLayerNumber(params.layer);
    const dlayer = params.layer ? layerNumber.type : LayerTypes.Base;
    if (!params.method || params.method === "universal") {
      const data = await window.api.doRuleTransition(`${params.rule}`);
      const image = new Image();
      image.src = data;
      image.onload = async () => {
        switch (dlayer) {
          case LayerTypes.Base: {
            const baseLayerTransition = this.transBaseLayerUniversal(params, image);
            const messageLayerTransition = this.transMessageLayerUniversal(params, image);
            const characterLayerTransition = this.transCharacterLayerUniversal(params, image);
            await Promise.all([...baseLayerTransition, ...messageLayerTransition, ...characterLayerTransition]);
            break;
          }
          case LayerTypes.Message: {
            await Promise.all(this.transMessageLayerUniversal(params, image));
            break;
          }
          case LayerTypes.Character: {
            await Promise.all(this.transCharacterLayerUniversal(params, image));
            break;
          }
        }
      };
    } else {
      switch (dlayer) {
        case LayerTypes.Base: {
          const baseLayerTransition = this.transBaseLayer(params);
          const messageLayerTransition = this.transMessageLayer(params);
          const characterLayerTransition = this.transCharacterLayer(params,);
          await Promise.all([...baseLayerTransition, ...messageLayerTransition, ...characterLayerTransition]);
          break;
        }
        case LayerTypes.Message: {
          await Promise.all(this.transMessageLayer(params));
          break;
        }
        case LayerTypes.Character: {
          await Promise.all(this.transCharacterLayer(params));
          break;
        }
      }
    }
  };

  if = (exp: string) => {
    if (exp) {
      const result = this.eval(exp);
      this.ignoreIf = !result;
    }
  };

  endif = () => {
    this.ignoreIf = false;
  };

  call = async (params: ParameterSet) => {
    this.stack.push({
      programCounter: this.programCounter,
      scriptName: this.currentScriptName,
    });
    await this.jump(params.storage, params.target);
  };

  wt = () => {
    this.transitionWaiting = true;
  };

  clearvar = () => {
    f = {};
  }

  clearsysvar = () => {
    sf = {};
  }

  store = (params: ParameterSet) => {
    if (params.store){
      this.isSaveEnabled = params.store === 'true';
    }
    if (params.restore) {
      this.isLoadEnabled = params.restore === 'true';
    }
  }

  history = (params: ParameterSet) => {
    if (params.output){
      this.isHistoryRecording = params.output === 'true';
    }
    if (params.enabled) {
      this.isHistoryEnabled = params.enabled === 'true';
    }
  }

  delay = (speed: string | number) => {
    if (typeof speed === 'string'){
      this.nowait();
    } else {
      for (const messageLayer of this.messageLayers) {
        messageLayer?.setSpeed(speed);
      }
    }
  }

  locate = (params: ParameterSet) => {
    for (const messageLayer of this.messageLayers) {
      messageLayer?.setCurrentCaretPosition({
        x: +params.x,
        y: +params.y,
      })
    }
  }

  button = async (params: ParameterSet) => {
    if (!params.graphic) {
      return;
    }
    const image = await window.api.getImage(`${params.graphic}`);
    await this.setButton({
      image,
      ...params,
    });
  }

  default = async (operation: Operation) => {
    if (this.script && operation.action in this.macroStore) {
      // Macro
      // console.log("Stack current PC and script;");
      this.stack.push({
        scriptName: this.currentScriptName,
        programCounter: this.programCounter,
      });
      // console.log("Stack current macro parameters");
      this.macroStack.push({...this.macroParams});
      // console.log("Load new macro parameters");
      this.macroParams = operation.params;
      // console.log("set mp variable");
      mp = operation.params;
      console.log("mp", mp);
      // console.log("Get macro information")
      const macroInformation = {...this.macroStore[operation.action]};
      // console.log("Jump to new PC of new script");
      await this.jump(macroInformation.storage, macroInformation.index);
    } else {
      // Undefined operation
      console.log(
        `%cundefined operation: ${operation.action}`,
        "color: red",
        operation.params
      );
    }
  };

  addPlugin = (plugin: {}) => {
    console.log("Add plugin");
    console.log(plugin);
  }

  onClick = async (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if(this.isPausing){
      return;
    }
    const position = this.getCanvasPosition({
      x: e.pageX - this.offset.x,
      y: e.pageY - this.offset.y,
    });
    console.log(`X: ${position.x}, Y: ${position.y}`);
    await this.click();
  }

  onMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if(this.isPausing){
      return;
    }
    for (const messageLayer of this.messageLayers) {
      this.currentMousePosition = this.getCanvasPosition({
        x: e.pageX - this.offset.x,
        y: e.pageY - this.offset.y,
      });
      messageLayer?.setCursorPosition(this.currentMousePosition);
    }
  }

  render() {
    return (
      <div
        ref={(e) => {
          this.dom = e;
        }}
        style={{
          position: "relative",
          width: `${this.getScWidth()}px`,
          height: `${this.getScHeight()}px`,
        }}
        onClick={this.onClick}
        onMouseMove={this.onMouseMove}
      >
        <ImageLayer
          key="base-layer"
          ref={(e) => {
            this.baseLayer = e;
          }}
          visible={true}
          width={this.getScWidth()}
          height={this.getScHeight()}
          showFrameRate={true}
        />
        {...this._characterLayers}
        {...this._messageLayers}
      </div>
    );
  }
}

export class FagPlugin {

}

export default Fsgs;
