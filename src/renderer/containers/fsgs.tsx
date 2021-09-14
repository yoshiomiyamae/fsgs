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

const TARGET_FPS = 120;

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
  private m_programCounter: number;
  private m_baseLayer: ImageLayer | null;
  private m_messageLayers: MessageLayerCollection;
  private m_characterLayers: ImageLayerCollection;
  private m_messageLayerElements: JSX.Element[];
  private m_characterLayerElements: JSX.Element[];
  private m_processing: boolean;
  private m_clickWaiting: boolean;
  private m_clickWaitingL: boolean;
  private m_clickWaitingP: boolean;
  private m_clickWaitingS: boolean;
  private m_stack: StackItem[];
  private m_macroStack: ParameterSetCollection;
  private m_macroParams: ParameterSet | null;
  private m_linkParams: ParameterSet | null;
  private m_currentMousePosition: Position;
  private m_dom: HTMLDivElement | null;
  private m_offset: Position;
  private m_audio: HTMLAudioElement | null;
  private m_currentMessageLayerNumber: number;
  private m_startAnchorEnabled: boolean;
  private m_startAnchorLabel: Operation;
  private m_previousLabel: Operation;
  private m_latestLabel: Operation;
  private m_currentScriptName: string;
  private m_transitionWaiting: boolean;
  private m_ignoreIf: boolean;
  private m_script: Script;
  private m_labelStore: {
    [labelName: string]: {
      storage: string;
      index: number;
    };
  };
  private m_macroStore: {
    [macroName: string]: {
      storage: string;
      index: number;
    };
  };
  private m_isPausing: boolean;
  private m_isHistoryRecording: boolean;
  private m_isHistoryEnabled: boolean;
  private m_isSaveEnabled: boolean;
  private m_isLoadEnabled: boolean;
  private m_config: Config;

  constructor(props: FsgsProps) {
    super(props);

    this.m_programCounter = 0;
    this.m_baseLayer = null;
    this.m_messageLayers = [];
    this.m_characterLayers = [];
    this.m_messageLayerElements = [];
    this.m_characterLayerElements = [];
    this.m_processing = false;
    this.m_clickWaiting = false;
    this.m_clickWaitingL = false;
    this.m_clickWaitingP = false;
    this.m_clickWaitingS = false;
    this.m_stack = [];
    this.m_macroStack = [];
    this.m_macroParams = null;
    this.m_linkParams = null;
    this.m_currentMousePosition = {
      x: 0,
      y: 0,
    };
    this.m_dom = null;
    this.m_offset = {
      x: 0,
      y: 0,
    };
    this.m_audio = null;
    this.m_currentMessageLayerNumber = 0;
    this.m_startAnchorEnabled = true;
    this.m_startAnchorLabel = this.m_previousLabel = this.m_latestLabel = {
      action: "label",
      params: {},
    };
    this.m_currentScriptName = "";
    this.m_transitionWaiting = false;
    this.m_ignoreIf = false;
    this.m_script = {
      labelIndices: {},
      macroIndices: {},
      scenario: [],
    };
    this.m_labelStore = {};
    this.m_macroStore = {};
    this.m_isPausing = false;
    this.m_isHistoryRecording = true;
    this.m_isHistoryEnabled = true;
    this.m_isSaveEnabled = true;
    this.m_isLoadEnabled = true;
    this.m_config = {};
  }

  initialize = async () => {
    fag = fsgs = this;

    document.onkeydown = this.onKeydown;

    const config = await window.api.getConfig();
    console.log(config);
    this.m_config = config;
    await window.api.window.setTitle(this.m_config.title || 'FSGS');

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

  private get scWidth() {return nullFallback(this.m_config.windowConfig?.scWidth, 640);}
  private get scHeight() {return nullFallback(this.m_config.windowConfig?.scHeight, 480);}
  private get chSpeedNormal() {return nullFallback(this.m_config.windowConfig?.chSpeeds?.normal, 30);}
  get messageLayerConfig () {
    return nullFallback(
      this.m_config.messageLayerConfig,
      messageLayerConfigDefault
    );
  }
  private get currentMessageLayer () {
    return this.m_messageLayers[this.m_currentMessageLayerNumber];
  }

  async componentDidMount() {
    await this.initialize();
    this.m_messageLayers = [];
    this.m_characterLayers = [];
    this.m_characterLayerElements = [];
    if (this.m_config.windowConfig) {
      if (this.m_config.windowConfig.numCharacterLayers) {
        for (
          let i = 0;
          i < this.m_config.windowConfig.numCharacterLayers;
          i++
        ) {
          this.m_characterLayerElements.push(
            <ImageLayer
              key={`character-layer-${i}`}
              ref={(e) => {
                this.m_characterLayers.push(e);
              }}
              visible={false}
              width={this.scWidth}
              height={this.scHeight}
            />
          );
        }
      }
      this.m_messageLayerElements = [];
      if (
        this.m_config.windowConfig.numMessageLayers &&
        this.m_config.windowConfig.chSpeeds
      ) {
        for (
          let i = 0;
          i < this.m_config.windowConfig.numMessageLayers;
          i++
        ) {
          this.m_messageLayerElements.push(
            <MessageLayer
              key={`"message-layer-${i}"`}
              ref={(e) => {
                this.m_messageLayers.push(e);
              }}
              speed={this.chSpeedNormal}
              width={this.scWidth}
              height={this.scHeight}
              config={this.messageLayerConfig}
              visible={i === 0}
            />
          );
        }
      }
    }
    this.m_stack = [];
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
    const height = verticalMargin + this.scHeight;
    const width = horizontalMargin + this.scWidth;
    console.log(
      `scWidth: ${this.scWidth}, scHeight: ${this.scHeight}`
    );
    const x = Math.round((window.screen.width - width) / 2);
    const y = Math.round((window.screen.height - height) / 2);
    window.api.window.setBounds({ height, width, x, y });
    this.m_programCounter = 0;
    if (this.m_dom) {
      this.m_audio = new Audio();
      this.m_dom.appendChild(this.m_audio);
    }
    setInterval(async () => {
      if (!this.m_processing) {
        // console.log("----- Update Frame Start -----");
        await this.updateCanvas();
        // console.log("------ Update Frame End ------");
      }
    }, 1000 / TARGET_FPS);

    this.setState({});
  }

  updateCanvas = async () => {
    if (this.m_isPausing){
      return;
    }
    if (this.m_dom) {
      const baseLayerSize = this.m_baseLayer?.size;
      if (baseLayerSize?.height === document.body.clientHeight) {
        this.m_offset.x = (document.body.clientWidth - baseLayerSize.width) / 2;
        this.m_offset.y = 0;
      } else if (baseLayerSize?.width === document.body.clientWidth) {
        this.m_offset.x = 0;
        this.m_offset.y = (document.body.clientHeight - baseLayerSize.height) / 2;
      } else {
        this.m_offset.x = 0;
        this.m_offset.y = 0;
      }
      this.m_dom.style.left = `${this.m_offset.x}px`;
      this.m_dom.style.top = `${this.m_offset.y}px`;
    }
    this.m_baseLayer?.update();
    for (const characterLayer of this.m_characterLayers) {
      characterLayer?.update();
    }
    for (const messageLayer of this.m_messageLayers) {
      if (messageLayer) {
        messageLayer.clickWaiting = this.m_clickWaiting;
        messageLayer.update();
        if (messageLayer.visible) {
          this.m_clickWaiting = messageLayer.isTextRemaining();
        }
      }
    }
    this.m_transitionWaiting =
      this.m_baseLayer?.transitionWorking ||
      this.m_characterLayers
        .map((characterLayer) => characterLayer?.transitionWorking)
        .reduce(
          (previousValue, currentValue) => previousValue || currentValue,
          false
        ) ||
      this.m_messageLayers
        .map((messageLayer) => messageLayer?.transitionWorking)
        .reduce(
          (previousValue, currentValue) => previousValue || currentValue,
          false
        ) ||
      false;
    if (this.m_script.scenario) {
      this.m_processing = true;
      if (this.m_script.scenario.length <= this.m_programCounter) {
        this.m_processing = false;
        return;
      }
      if (
        !this.m_transitionWaiting &&
        !this.m_clickWaiting &&
        !this.m_clickWaitingL &&
        !this.m_clickWaitingP &&
        !this.m_clickWaitingS
      ) {
        const operation = this.m_script.scenario[this.m_programCounter];
        await this.operate(operation);
        this.m_programCounter++;
      }
      this.m_processing = false;
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
      this.m_startAnchorLabel.params.storage,
      `*${this.m_startAnchorLabel.params.name}`
    );
  goBack = async () =>
    await this.jump(
      this.m_previousLabel.params.storage,
      `*${this.m_previousLabel.params.name}`
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
    this.m_currentScriptName = data.filePath;
    this.m_script = data.script;
    if (this.m_script) {
      for (const labelName in this.m_script.labelIndices) {
        if (this.m_script) {
          this.m_labelStore[labelName] = {
            storage: data.filePath,
            index: this.m_script.labelIndices[labelName],
          };
        }
      }
      for (const macroName in this.m_script.macroIndices) {
        if (this.m_script) {
          this.m_macroStore[macroName] = {
            storage: data.filePath,
            index: this.m_script.macroIndices[macroName],
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
      image.onload = null;
      const messageLayer = this.currentMessageLayer;
      args.image = image;
      console.log(messageLayer);
      messageLayer?.addButton(args);
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
          this.m_baseLayer?.setImage(image, args.page);
          break;
        }
        case "graph": {
          const messageLayer = this.currentMessageLayer;
          await messageLayer?.writeGraph(image);
          break;
        }
        case "message": {
          const messageLayer = this.m_messageLayers[
            args.layerNumber || this.m_currentMessageLayerNumber
          ];
          if (!messageLayer)
          {
            return;
          }
          messageLayer.frame = image;
          break;
        }
        default: {
          if (args.layerNumber === null || args.layerNumber === undefined) {
            throw "layerNumber must be specified.";
          }
          const characterLayer = this.m_characterLayers[args.layerNumber];
          if (characterLayer) {
            if (args.page) {
              characterLayer.setImage(image, args.page);
            }
            if (args.left) {
              characterLayer.left = args.left;
            }
            if (args.top) {
              characterLayer.top = args.top;
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
        ...this.m_macroParams,
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
            (this.m_macroParams && this.m_macroParams[currentValue.substring(1)]) ||
            ""
          );
        } else if (currentValue) {
          return currentValue;
        }
        return "";
      }, "");
      // console.log("param after: %j", JSON.stringify(operation.params)`);
    }
    if (this.m_ignoreIf && ['elseif', 'endif'].indexOf(operation.action) === -1) {
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
    this.m_isPausing = true;
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
    this.m_isPausing = false;
  };

  getCanvasPosition = (pagePosition: Position) => {
    const baseLayerSize = this.m_baseLayer?.size;
    if (!baseLayerSize) {
      return {
        x: 0,
        y: 0,
      } as Position;
    }
    const width = this.scWidth;
    const height = this.scHeight;
    const canvasPosition: Position = {
      x: (pagePosition.x / baseLayerSize.width) * width,
      y: (pagePosition.y / baseLayerSize.height) * height,
    };

    return canvasPosition;
  };

  getProgramCounter = (target: string | number) => {
    if (typeof target === "string") {
      const label = this.m_labelStore[target.substr(1)];
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
      `storage: ${storage}, target: ${target}, currentScript: ${this.m_currentScriptName}, currentPC: ${this.m_programCounter}`
    );
    if (storage && (target === null || target === undefined)) {
      if (storage !== this.m_currentScriptName) {
        await this.loadScript(storage, 0);
        return;
      } else {
        // console.log("Jump to first.");
        this.m_programCounter = 0;
      }
    } else if (storage && target !== null && target !== undefined) {
      if (storage !== this.m_currentScriptName) {
        await this.loadScript(storage, target);
        return;
      } else {
        const programCounter = this.getProgramCounter(target);
        // console.log(`Jump to ${target} (${programCounter}) of script ${storage}`);
        this.m_programCounter = programCounter;
      }
    } else if (!storage && target !== null && target !== undefined) {
      const programCounter = this.getProgramCounter(target);
      // console.log(`Jump to ${target} (${programCounter})`);
      this.m_programCounter = programCounter;
    } else {
      // console.log("Jump to first.");
      this.m_programCounter = 0;
    }
    this.m_clickWaiting = false;
    this.m_clickWaitingL = false;
    this.m_clickWaitingS = false;
    this.m_clickWaitingP = false;
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
    if(this.m_isPausing){
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
        const messageLayer = this.currentMessageLayer;
        if (!messageLayer) {
          return;
        }
        this.m_currentMousePosition = messageLayer.getPreviousChoicePosition(
          this.m_currentMousePosition
        );
        messageLayer.cursorPosition = this.m_currentMousePosition;
        return;
      }
      case "ArrowDown": {
        const messageLayer = this.currentMessageLayer;
        if (!messageLayer) {
          return;
        }
        this.m_currentMousePosition = messageLayer.getNextChoicePosition(
          this.m_currentMousePosition
        );
        messageLayer.cursorPosition = this.m_currentMousePosition;
        return;
      }
    }
  };

  private click = async () => {
    if (this.m_clickWaitingP) {
      for (const messageLayer of this.m_messageLayers) {
        messageLayer?.clear();
      }
    }
    if (this.m_clickWaitingS) {
      for (const messageLayer of this.m_messageLayers) {
        const linkParams = messageLayer?.click();
        if (linkParams) {
          linkParams.exp && this.eval(linkParams.exp);
          await this.jump(linkParams.storage, linkParams.target);
        }
      }
    }
    this.m_clickWaiting = false;
    this.m_clickWaitingL = false;
    this.m_clickWaitingP = false;
  };

  backlay = (params: ParameterSet) => {
    if (!params.layer) {
      return;
    }
    const layerNumber = this.parseLayerNumber(params.layer);
    const layer =
      layerNumber.type === LayerTypes.Base
        ? this.m_baseLayer
        : layerNumber.type === LayerTypes.Message
        ? this.m_messageLayers[layerNumber.number]
        : this.m_characterLayers[layerNumber.number];
    layer?.copyForeToBack();
  };

  ch = (text: string) => {
    const messageLayer = this.currentMessageLayer;
    if(!messageLayer){
      return;
    }
    messageLayer.text = text;
  };

  cm = () => {
    for (const messageLayer of this.m_messageLayers) {
      if(!messageLayer){
        continue;
      }
      messageLayer.clear();
    }
  };

  image = async (params: ParameterSet) => {
    switch (params.layer) {
      case "base": {
        if (params.visible && this.m_baseLayer) {
            this.m_baseLayer.visible = params.visible === "true";
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
          const characterLayer = this.m_characterLayers[layerNumber];
          if (characterLayer){
            characterLayer.visible = params.visible === "true";
          }
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
    this.m_clickWaitingL = true;
  };

  r = () => {
    for (const messageLayer of this.m_messageLayers) {
      messageLayer?.addCarriageReturn();
    }
  };

  p = () => {
    this.m_clickWaitingP = true;
  };

  wait = async (time: number) => {
    await sleep(time);
  };

  text = (text: string) => {
    console.log(text);
    if (this.m_linkParams) {
      this.m_linkParams.text = text;
    } else {
      const messageLayer = this.currentMessageLayer;
      if(!messageLayer){
        return;
      }
      messageLayer.text = text;
      this.m_clickWaiting = true;
    }
  };

  return = async () => {
    const stackItem = this.m_stack.pop();
    if (stackItem) {
      await this.jump(stackItem.scriptName, stackItem.programCounter);
    }
  };

  endmacro = async () => {
    // this.ignoreIf = false;
    const macroStackItem = this.m_macroStack.pop();
    const stackItem = this.m_stack.pop();
    if (macroStackItem) {
      console.log("Macro stack item: %j", macroStackItem);
      this.m_macroParams = macroStackItem;
    }
    if (stackItem) {
      await this.jump(stackItem.scriptName, stackItem.programCounter);
    }
  };

  macro = () => {
    // this.ignoreIf = false;
    if (this.m_script) {
      while (this.m_script.scenario[++this.m_programCounter].action !== "endmacro");
    }
  };

  font = (params: ParameterSet) => {
    if (params.color) {
      for (const messageLayer of this.m_messageLayers) {
        if(!messageLayer){
          continue;
        }
        messageLayer.fontColor = params.color;
      }
    }
    if (params.size) {
      for (const messageLayer of this.m_messageLayers) {
        if(!messageLayer){
          continue;
        }
        messageLayer.fontSize = params.size;
      }
    }
    if (params.edge) {
      for (const messageLayer of this.m_messageLayers) {
        if(!messageLayer){
          continue;
        }
        messageLayer.fontEdge = params.edge;
      }
    }
    if (params.edgecolor) {
      for (const messageLayer of this.m_messageLayers) {
        if(!messageLayer){
          continue;
        }
        messageLayer.fontEdgeColor = params.edgecolor;
      }
    }
    if (params.shadow) {
      for (const messageLayer of this.m_messageLayers) {
        if(!messageLayer){
          continue;
        }
        messageLayer.fontShadow = params.shadow;
      }
    }
  };

  resetfont = () => {
    for (const messageLayer of this.m_messageLayers) {
      if(!messageLayer){
        continue;
      }
      messageLayer.resetFont();
    }
  };

  resetstyle = () => {
    for (const messageLayer of this.m_messageLayers) {
      if(!messageLayer){
        continue;
      }
      messageLayer.resetAlignment();
    }
  };

  style = (align: string) => {
    if (align) {
      for (const messageLayer of this.m_messageLayers) {
        if(!messageLayer){
          continue;
        }
        messageLayer.alignment = align;
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
    this.m_clickWaitingS = true;
  };

  link = (params: ParameterSet) => {
    this.m_linkParams = params;
  };

  endlink = async () => {
    if (!this.m_linkParams) {
      return;
    }
    const messageLayer = this.currentMessageLayer;
    await messageLayer?.addLink(this.m_linkParams);
    this.m_linkParams = null;
  };

  label = (operation: Operation) => {
    console.log(`Label: ${operation.params.name} (${operation.params.alias}) passed.`)
    this.m_latestLabel = operation;
  };

  edit = (params: ParameterSet) => {
    const messageLayer = this.currentMessageLayer;
    messageLayer?.addEdit(params, (value: string) => {
      eval(`${params.name} = '${value}'`);
    });
  };

  emb = (exp: string) => {
    const text = `${eval(exp)}`;
    const messageLayer = this.currentMessageLayer;
    if(!messageLayer){
      return;
    }
    messageLayer.text = text;
    this.m_clickWaiting = true;
  };

  nowait = () => {
    for (const messageLayer of this.m_messageLayers) {
      if(!messageLayer){
        continue;
      }
      messageLayer.noWait = true;
    }
  };

  endnowait = () => {
    for (const messageLayer of this.m_messageLayers) {
      if(!messageLayer){
        continue;
      }
      messageLayer.noWait = false;
    }
  };

  layopt = (params: ParameterSet) => {
    if (params.layer === null || params === undefined) {
      return;
    }
    const layerName = this.parseLayerNumber(params.layer);
    const layer =
      layerName.type === LayerTypes.Message
        ? this.m_messageLayers[layerName.number]
        : this.m_characterLayers[layerName.number];
    if (layer) {
      if (params.visible) {
        layer.visible = params.visible === "true";
      }
      if (params.opacity) {
        layer.opacity = parseInt(params.opacity) / 0xff;
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
    const messageLayer = this.currentMessageLayer;
    if(!messageLayer){
      return;
    }
    messageLayer.ruby = text;
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
      messageLayer = this.m_messageLayers[messageLayerNumber];
    } else {
      messageLayer = this.currentMessageLayer;
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
    params.vertical && (messageLayer.vertical = params.vertical === "true");
    params.left && (messageLayer.left = parseInt(params.left));
    params.top && (messageLayer.top = parseInt(params.top));
    params.marginl && (messageLayer.marginL = parseInt(params.marginl));
    params.margint && (messageLayer.marginT = parseInt(params.margint));
    params.marginr && (messageLayer.marginR = parseInt(params.marginr));
    params.marginb && (messageLayer.marginB = parseInt(params.marginb));
    params.visible && (messageLayer.visible = params.visible === "true");
    messageLayer.clear();
  };

  playbgm = async (params: ParameterSet) => {
    const data = await window.api.getAudio(`bgm/${params.storage}`);
    if (!this.m_audio) {
      return;
    }
    this.m_audio.preload = "none";
    this.m_audio.src = data;
    this.m_audio.loop = params.loop === "true";
    this.m_audio.play();
  };

  stopbgm = () => {
    this.m_audio?.pause();
  };

  current = (params: ParameterSet) => {
    if (!params.layer) {
      return;
    }
    this.m_currentMessageLayerNumber = this.parseLayerNumber(params.layer).number;
    const messageLayer = this.currentMessageLayer;
    if (!messageLayer) {
      return;
    }
    messageLayer.currentPage = params.page || "fore";
  };

  startanchor = (enabled: boolean) => {
    this.m_startAnchorEnabled = enabled || true;
    if (this.m_startAnchorEnabled) {
      this.m_startAnchorLabel = this.m_latestLabel;
    }
  };

  record = () => {
    this.m_previousLabel = this.m_latestLabel;
  };

  transBaseLayerUniversal = (params: ParameterSet, rule: HTMLImageElement) => [this.m_baseLayer]
    .filter(layer => layer !== null)
    .map(layer => layer!.transition(
      "universal",
      params.time,
      {
        rule: rule,
        vague: params.vague,
      }
    ));
  transMessageLayerUniversal = (params: ParameterSet, rule: HTMLImageElement) => this.m_messageLayers
    .filter(layer => layer !== null)
    .map(layer => layer!.transition(
      "universal",
      params.time,
      {
        rule: rule,
        vague: params.vague,
      }
    ));
  transCharacterLayerUniversal = (params: ParameterSet, rule: HTMLImageElement) => this.m_characterLayers
    .filter(layer => layer !== null)
    .map(layer => layer!.transition(
      "universal",
      params.time,
      {
        rule: rule,
        vague: params.vague,
      }
    ));
  transBaseLayer = (params: ParameterSet) => [this.m_baseLayer]
    .filter(layer => layer !== null)
    .map(layer => layer!.transition(params.method, parseInt(params.time), {
      from: params.from,
      stay: params.stay,
    }));
  transMessageLayer = (params: ParameterSet) => this.m_messageLayers
    .filter(layer => layer !== null)
    .map(layer => layer!.transition(params.method, parseInt(params.time), {
      from: params.from,
      stay: params.stay,
    }));
  transCharacterLayer = (params: ParameterSet) => this.m_characterLayers
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
      this.m_ignoreIf = !result;
    }
  };

  endif = () => {
    this.m_ignoreIf = false;
  };

  call = async (params: ParameterSet) => {
    this.m_stack.push({
      programCounter: this.m_programCounter,
      scriptName: this.m_currentScriptName,
    });
    await this.jump(params.storage, params.target);
  };

  wt = () => {
    this.m_transitionWaiting = true;
  };

  clearvar = () => {
    f = {};
  }

  clearsysvar = () => {
    sf = {};
  }

  store = (params: ParameterSet) => {
    if (params.store){
      this.m_isSaveEnabled = params.store === 'true';
    }
    if (params.restore) {
      this.m_isLoadEnabled = params.restore === 'true';
    }
  }

  history = (params: ParameterSet) => {
    if (params.output){
      this.m_isHistoryRecording = params.output === 'true';
    }
    if (params.enabled) {
      this.m_isHistoryEnabled = params.enabled === 'true';
    }
  }

  delay = (speed: string | number) => {
    if (typeof speed === 'string'){
      this.nowait();
    } else {
      for (const messageLayer of this.m_messageLayers) {
        if (!messageLayer) {
          continue;
        }
        messageLayer.speed = speed;
      }
    }
  }

  locate = (params: ParameterSet) => {
    for (const messageLayer of this.m_messageLayers) {
      if (!messageLayer) {
        continue;
      }
      messageLayer.currentCaretPosition = {
        x: +params.x,
        y: +params.y,
      };
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
    if (this.m_script && operation.action in this.m_macroStore) {
      // Macro
      // console.log("Stack current PC and script;");
      this.m_stack.push({
        scriptName: this.m_currentScriptName,
        programCounter: this.m_programCounter,
      });
      // console.log("Stack current macro parameters");
      this.m_macroStack.push({...this.m_macroParams});
      // console.log("Load new macro parameters");
      this.m_macroParams = operation.params;
      // console.log("set mp variable");
      mp = operation.params;
      console.log("mp", mp);
      // console.log("Get macro information")
      const macroInformation = {...this.m_macroStore[operation.action]};
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
    if(this.m_isPausing){
      return;
    }
    const position = this.getCanvasPosition({
      x: e.pageX - this.m_offset.x,
      y: e.pageY - this.m_offset.y,
    });
    console.log(`X: ${position.x}, Y: ${position.y}`);
    await this.click();
  }

  onMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if(this.m_isPausing){
      return;
    }
    this.m_currentMousePosition = this.getCanvasPosition({
      x: e.pageX - this.m_offset.x,
      y: e.pageY - this.m_offset.y,
    });
    for (const messageLayer of this.m_messageLayers) {
      if (!messageLayer) {
        continue;
      }
      messageLayer.cursorPosition = this.m_currentMousePosition;
    }
  }

  render() {
    return (
      <div
        ref={(e) => {
          this.m_dom = e;
        }}
        style={{
          position: "relative",
          width: `${this.scWidth}px`,
          height: `${this.scHeight}px`,
        }}
        onClick={this.onClick}
        onMouseMove={this.onMouseMove}
      >
        <ImageLayer
          key="base-layer"
          ref={(e) => {
            this.m_baseLayer = e;
          }}
          visible={true}
          width={this.scWidth}
          height={this.scHeight}
          showFrameRate={true}
        />
        {...this.m_characterLayerElements}
        {...this.m_messageLayerElements}
      </div>
    );
  }
}

export class FagPlugin {

}

export default Fsgs;
