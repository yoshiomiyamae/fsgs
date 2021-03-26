import * as React from "react";
import {
  Operation,
  Script,
  Config,
  ParameterCollection,
  SetImageArgs,
  Position,
  LayerNumber,
  SetScriptArgs,
  StackItem,
  LayerTypes,
} from "../models/fsgs-model";
import {
  MessageLayer,
  MessageLayerCollection,
} from "../components/message-layer";
import { ImageLayer, ImageLayerCollection } from "../components/image-layer";
import { sleep, nullFallback } from "../common";
import { messageLayerConfigDefault } from "../configs/config";
import ts from "typescript";
import "../style.scss";

let kag: Fsgs;
let fsgs: Fsgs;
let mp: {};

let f: {};
let sf: {};
let tf: {};

const str2num = (value: string) => {
  return +value;
};

const random = Math.random;

const intrandom = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const styles = {
  mainWindow: {
    position: "relative",
  } as React.CSSProperties,
};

export interface FsgsProps {
  updateCanvas?: (context: CanvasRenderingContext2D) => void;
  config?: Config;
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
  private macroParams: ParameterCollection | null;
  private linkParams: ParameterCollection | null;
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
    this.initialize();
  }

  initialize = async () => {
    f = {};
    sf = {};
    tf = {};

    kag = fsgs = this;

    document.onkeydown = this.onKeydown;

    await window.api.onMenuClicked((action: string) => {
      switch (action) {
        case "go-to-start": {
          this.goToStart();
          break;
        }
        case "go-back": {
          this.goBack();
          break;
        }
        case "exit": {
          this.shutdown();
          break;
        }
      }
    });
  };

  private getScWidth = () =>
    nullFallback(
      this.props.config &&
        this.props.config.windowConfig &&
        this.props.config.windowConfig.scWidth,
      640
    );
  private getScHeight = () =>
    nullFallback(
      this.props.config &&
        this.props.config.windowConfig &&
        this.props.config.windowConfig.scHeight,
      480
    );
  private getChSpeedNormal = () =>
    nullFallback(
      this.props.config &&
        this.props.config.windowConfig &&
        this.props.config.windowConfig.chSpeeds &&
        this.props.config.windowConfig.chSpeeds.normal,
      30
    );
  private getMessageLayerConfig = () =>
    nullFallback(
      this.props.config && this.props.config.messageLayerConfig,
      messageLayerConfigDefault
    );

  async componentDidMount() {
    console.log("!!!");
    this.messageLayers = [];
    this.characterLayers = [];
    this._characterLayers = [];
    console.log(this.props.config);
    console.log(this.props.config?.windowConfig);
    if (this.props.config && this.props.config.windowConfig) {
      if (this.props.config.windowConfig.numCharacterLayers) {
        for (
          let i = 0;
          i < this.props.config.windowConfig.numCharacterLayers;
          i++
        ) {
          this._characterLayers.push(
            <ImageLayer
              key={"character-layer-" + i}
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
        this.props.config.windowConfig.numMessageLayers &&
        this.props.config.windowConfig.chSpeeds
      ) {
        for (
          let i = 0;
          i < this.props.config.windowConfig.numMessageLayers;
          i++
        ) {
          this._messageLayers.push(
            <MessageLayer
              key={"message-layer-" + i}
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
    console.log(windowBounds);
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
    console.log({ height, width, x, y });
    window.api.window.setBounds({ height, width, x, y });
    this.programCounter = 0;
    if (this.dom) {
      this.audio = new Audio();
      this.dom.appendChild(this.audio);
    }
    console.log(this.programCounter);
    this.timer = setInterval(() => {
      if (!this.processing) {
        this.updateCanvas();
      }
    }, 16);

    this.setState({});
  }

  updateCanvas = async () => {
    if (this.dom) {
      const baseLayerSize = this.baseLayer && this.baseLayer.getSize();
      if (
        baseLayerSize &&
        baseLayerSize.height === document.body.clientHeight
      ) {
        this.offset.x = (document.body.clientWidth - baseLayerSize.width) / 2;
        this.offset.y = 0;
      } else if (
        baseLayerSize &&
        baseLayerSize.width === document.body.clientWidth
      ) {
        this.offset.x = 0;
        this.offset.y = (document.body.clientHeight - baseLayerSize.height) / 2;
      } else {
        this.offset.x = 0;
        this.offset.y = 0;
      }
      this.dom.style.left = `${this.offset.x}px`;
      this.dom.style.top = `${this.offset.y}px`;
    }
    this.baseLayer && this.baseLayer.update();
    for (const characterLayer of this.characterLayers) {
      characterLayer && characterLayer.update();
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
      (this.baseLayer && this.baseLayer.getTransitionWorking()) ||
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
    if (this.script && this.script.scenario) {
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

  goToStart = () =>
    this.jump(
      this.startAnchorLabel.params.storage,
      `*${this.startAnchorLabel.params.name}`
    );
  goBack = () =>
    this.jump(
      this.previousLabel.params.storage,
      `*${this.previousLabel.params.name}`
    );
  loadScript = async (
    scriptName: string,
    startFrom: string | number,
    offset?: number
  ) => {
    const data: SetScriptArgs = await window.api.getScript({
      scriptName,
      startFrom,
      offset: offset || 0,
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
    this.jump(null, data.startFrom, null, data.offset);
  };

  setImage = (args: SetImageArgs) => {
    const image = new Image();
    image.src = args.data;
    image.onload = () => {
      switch (args.layer) {
        case "base": {
          if (!args.page) {
            throw "page must be specified.";
          }
          this.baseLayer && this.baseLayer.setImage(image, args.page);
          break;
        }
        case "graph": {
          const messageLayer = this.messageLayers[this.currentMessageLayer];
          messageLayer?.writeGraph(image);
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
    console.log(operation);
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
    }
    if (this.ignoreIf || operation.action in ["else", "elseif", "endif"]) {
      return;
    }
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
        this.return();
        break;
      }
      case "endmacro": {
        this.endmacro();
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
        this.endlink();
        break;
      }
      case "label": {
        this.label(operation);
        break;
      }
      case "jump": {
        this.jump(
          operation.params.storage,
          operation.params.target,
          operation.params.cond
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
        this.goToStart();
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
      case "else":
      case "endif": {
        this.endif();
        break;
      }
      case "call": {
        this.call(operation.params);
        break;
      }
      case "inlineScript": {
        this.eval(operation.params.script);
        break;
      }
      default: {
        this.default(operation);
        break;
      }
    }
  };

  shutdown = async () => {
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
  };

  getCanvasPosition = (pagePosition: Position) => {
    const baseLayerSize = this.baseLayer && this.baseLayer.getSize();
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
      const label = this.script && this.labelStore[target.substr(1)];
      if (label) {
        return label.index;
      }
    } else if (typeof target === "number") {
      return target;
    }
    return 0;
  };

  jump = (
    storage: string | null,
    target: string | number | null,
    condition?: string | null,
    offset?: number
  ) => {
    console.log(
      `storage: ${storage}, target: ${target}, condition: ${condition}, currentScript: ${this.currentScriptName}, offset: ${offset}`
    );
    if (condition && !eval(condition)) {
      this.return;
    }
    if (storage && !target) {
      if (storage !== this.currentScriptName) {
        this.loadScript(storage, 0);
      } else {
        this.programCounter = 0;
      }
    } else if (storage && target) {
      if (storage !== this.currentScriptName) {
        this.loadScript(storage, target, 1);
      } else {
        this.programCounter = this.getProgramCounter(target);
      }
    } else if (!storage && target) {
      this.programCounter = this.getProgramCounter(target) + (offset || 0);
    } else {
      this.programCounter = 0;
    }
    this.clickWaiting = false;
    this.clickWaitingL = false;
    this.clickWaitingS = false;
    this.clickWaitingP = false;
  };

  eval = (script?: string) => {
    if (!script) {
      return null;
    }
    try {
      const transpiledScript = ts.transpile(script);
      console.log(`eval(${transpiledScript})`);
      const result = eval(transpiledScript);
      console.log("result", result);
      return result;
    } catch (e) {
      console.log(e);
    }
  };

  private onKeydown = async (e: KeyboardEvent) => {
    switch (e.code) {
      case "Enter": {
        if (e.altKey) {
          const isFullScreen = await window.api.window.isFullScreen();
          await window.api.window.setFullScreen(isFullScreen);
        } else {
          this.click();
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

  private click = () => {
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
          this.jump(linkParams.storage, linkParams.target);
        }
      }
    }
    this.clickWaiting = false;
    this.clickWaitingL = false;
    this.clickWaitingP = false;
  };

  backlay = (params: ParameterCollection) => {
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
    layer && layer.copyForeToBack();
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

  image = async (params: ParameterCollection) => {
    switch (params.layer) {
      case "base": {
        if (params.visible) {
          this.baseLayer &&
            this.baseLayer.setVisible(params.visible === "true");
        }
        const data = await window.api.getImage(`bgimage/${params.storage}`);
        this.setImage({
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
        const data = await window.api.getImage(`fgimage/${params.storage}`);
        this.setImage({
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
    if (this.linkParams) {
      this.linkParams.text = text;
    } else {
      const messageLayer = this.messageLayers[this.currentMessageLayer];
      messageLayer?.setText(text);
      this.clickWaiting = true;
    }
  };

  return = () => {
    const stackItem = this.stack.pop();
    if (stackItem) {
      this.jump(stackItem.scriptName, stackItem.programCounter + 1);
    }
  };

  endmacro = () => {
    const stackItem = this.stack.pop();
    if (stackItem) {
      this.jump(stackItem.scriptName, stackItem.programCounter);
    }
  };

  macro = () => {
    if (this.script) {
      while (this.script.scenario[++this.programCounter].action !== "endmacro");
    }
  };

  font = (params: ParameterCollection) => {
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
    const data = await window.api.getImage(`image/${storage}`);
    this.setImage({
      data,
      layer: "graph",
    });
  };

  s = () => {
    this.clickWaitingS = true;
  };

  link = (params: ParameterCollection) => {
    this.linkParams = params;
  };

  endlink = () => {
    if (!this.linkParams) {
      return;
    }
    const messageLayer = this.messageLayers[this.currentMessageLayer];
    messageLayer?.setLink(this.linkParams);
    this.linkParams = null;
  };

  label = (operation: Operation) => {
    this.latestLabel = operation;
  };

  edit = (params: ParameterCollection) => {
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

  layopt = (params: ParameterCollection) => {
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

  position = async (params: ParameterCollection) => {
    const messageLayer = this.messageLayers[this.currentMessageLayer];
    if (!messageLayer) {
      return;
    }
    if (params.frame) {
      const data = await window.api.getImage(`image/${params.frame}`);
      this.setImage({
        data,
        layer: "message",
        layerNumber: 0,
      });
    }
    params.vertical && messageLayer.setVertical(params.vertical === "true");
    params.left && messageLayer.setLeft(parseInt(params.left));
    params.top && messageLayer.setTop(parseInt(params.top));
    params.marginl && messageLayer.setMarginL(parseInt(params.marginl));
    params.margint && messageLayer.setMarginT(parseInt(params.margint));
    params.marginr && messageLayer.setMarginR(parseInt(params.marginr));
    params.marginb && messageLayer.setMarginB(parseInt(params.marginb));
    messageLayer.clear();
  };

  playbgm = async (params: ParameterCollection) => {
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
    this.audio && this.audio.pause();
  };

  current = (params: ParameterCollection) => {
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

  trans = async (params: ParameterCollection) => {
    const layerNumber = this.parseLayerNumber(params.layer);
    if (!params.method || params.method === "universal") {
      const data = await window.api.doRuleTransition(`${params.rule}`);
      const dlayer = params.layer ? layerNumber.type : LayerTypes.Base;
      const image = new Image();
      image.src = data;
      image.onload = () => {
        const layer =
          dlayer === LayerTypes.Base
            ? this.baseLayer
            : dlayer === LayerTypes.Message
            ? this.messageLayers[layerNumber.number]
            : this.characterLayers[layerNumber.number];
        layer &&
          layer.transition("universal", params.time, {
            rule: image,
            vague: params.vague,
          });
      };
    } else {
      const layer = params.layer
        ? layerNumber.type === LayerTypes.Message
          ? this.messageLayers[layerNumber.number]
          : this.characterLayers[layerNumber.number]
        : this.baseLayer;
      layer &&
        layer.transition(params.method, parseInt(params.time), {
          from: params.from,
          stay: params.stay,
        });
    }
  };

  if = (exp: string) => {
    if (exp) {
      this.ignoreIf = !this.eval(exp);
    }
  };

  endif = () => {
    this.ignoreIf = false;
  };

  call = (params: ParameterCollection) => {
    this.stack.push({
      programCounter: this.programCounter,
      scriptName: this.currentScriptName,
    });
    this.jump(params.storage, params.target);
  };

  wt = () => {
    this.transitionWaiting = true;
  };

  default = (operation: Operation) => {
    if (this.script && operation.action in this.macroStore) {
      // Macro
      this.stack.push({
        scriptName: this.currentScriptName,
        programCounter: this.programCounter,
      });
      this.macroParams = operation.params;
      mp = operation.params;
      const macroInformation = this.macroStore[operation.action];
      this.jump(macroInformation.storage, macroInformation.index);
    } else {
      // Undefined operation
      console.log(
        `%cundefined operation: ${operation.action}`,
        "color: red",
        operation.params
      );
    }
  };

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
        onClick={(e) => {
          const position = this.getCanvasPosition({
            x: e.pageX - this.offset.x,
            y: e.pageY - this.offset.y,
          });
          console.log(`X: ${position.x}, Y: ${position.y}`);
          this.click();
        }}
        onMouseMove={(e) => {
          for (const messageLayer of this.messageLayers) {
            this.currentMousePosition = this.getCanvasPosition({
              x: e.pageX - this.offset.x,
              y: e.pageY - this.offset.y,
            });
            messageLayer?.setCursorPosition(this.currentMousePosition);
          }
        }}
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

export default Fsgs;
