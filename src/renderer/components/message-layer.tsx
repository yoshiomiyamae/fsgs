import * as React from "react";
import {
  Font,
  Position,
  Size,
  MessageLayerConfig,
  Alignment,
  ParameterCollection,
  ClickableAreaCollection,
  Rectangle,
  ClickableArea,
  ColorObject,
  TransitionSetting,
} from "../models/fsgs-model";
import {
  sleep,
  integerToColorString,
  colorStringToInteger,
  margeRectangle,
  integerToRgb,
  nullFallback,
  positionIsInRectangle,
} from "../common";
import { LayerPages } from "../../main/model";

export interface MessageLayerProps {
  speed: number;
  visible: boolean;
  width: number;
  height: number;
  config: MessageLayerConfig;
}

interface MessageLayerElementSet {
  dom: HTMLDivElement | null;
  base: HTMLCanvasElement | null;
  highlight: HTMLCanvasElement | null;
  form: HTMLDivElement | null;
}

export class MessageLayer extends React.Component<
  MessageLayerProps,
  MessageLayerProps
> {
  private dom: HTMLDivElement | null;
  private fore: MessageLayerElementSet;
  private back: MessageLayerElementSet;
  private remainingText: string;
  private config: MessageLayerConfig;
  private currentCaretPosition: Position;
  private speed?: number;
  private processing: boolean;
  private visible: boolean;
  private clickWaiting: boolean;
  private defaultFont: Font;
  private font: Font;
  private lineHeight: number;
  private lineWidths: number[];
  private currentLine: number;
  private textAlignment: Alignment;
  private afterSetAlignment: boolean;
  private clickableAreas: ClickableAreaCollection;
  private cursorPosition: Position | null;
  private noWait: boolean;
  private ruby: string;
  private vertical: boolean;
  private ml: number;
  private mt: number;
  private mw: number;
  private mh: number;
  private marginL: number;
  private marginT: number;
  private marginR: number;
  private marginB: number;
  private frame: HTMLImageElement | null;
  private shadow: boolean;
  private shadowColor: number | null;
  private currentPage: LayerPages;
  private transitionWorking: boolean;
  private isCharacterRotated: boolean;
  private rotationAnchor: Position | undefined;

  constructor(props: MessageLayerProps) {
    super(props);
    this.dom = null;
    this.fore = {
      dom: null,
      base: null,
      highlight: null,
      form: null,
    };
    this.back = {
      dom: null,
      base: null,
      highlight: null,
      form: null,
    };
    this.remainingText = "";
    this.speed = props.speed;
    this.processing = false;
    this.visible = props.visible;
    this.clickWaiting = false;
    this.config = props.config;
    this.defaultFont = { ...this.config.defaultFont };
    this.font = { ...this.config.defaultFont };
    this.lineHeight = this.getFontSize() + this.getRubySize() + this.getRubyOffset();
    this.lineWidths = [];
    this.currentLine = 0;
    this.textAlignment = Alignment.Default;
    this.ml = this.getML();
    this.mt = this.getMT();
    this.mw = this.getMW();
    this.mh = this.getMH();
    this.marginL = this.getMarginL();
    this.marginT = this.getMarginT();
    this.marginR = this.getMarginR();
    this.marginB = this.getMarginB();
    this.currentCaretPosition = {
      x: this.getMarginL() + this.getML(),
      y: this.getMarginT() + this.getMT(),
    };
    this.afterSetAlignment = false;
    this.clickableAreas = [];
    this.cursorPosition = null;
    this.noWait = false;
    this.ruby = "";
    this.vertical = this.getVertical();
    this.frame = null;
    this.shadow = this.getShadow();
    this.shadowColor = this.getShadowColor();
    this.currentPage = LayerPages.Fore;
    this.transitionWorking = false;
    this.isCharacterRotated = false;
    this.rotationAnchor = {
      x: 0,
      y: 0,
    }
  }

  changeFont = (font: Font) => {
    this.config.defaultFont = font;
  };

  setText = (text: string) => {
    const context = this.fore.base?.getContext("2d");
    const lineWidth = this.getMW() - this.getMarginR();
    let textWidth = context?.measureText(text).width;

    if (textWidth) {
      this.lineWidths = [];
      for (; textWidth >= lineWidth; textWidth -= lineWidth) {
        this.lineWidths.push(lineWidth);
      }
      if (textWidth !== 0) {
        this.lineWidths.push(textWidth);
      }
    }

    this.remainingText = text;
    this.currentLine = 0;
    if (!this.afterSetAlignment) {
      return;
    }
    if (this.vertical) {
      this.currentCaretPosition.y = this.calculateTopMargin();
    } else {
      this.currentCaretPosition.x = this.calculateLeftMargin();
    }
    this.afterSetAlignment = false;
  };

  setRuby = (text: string) => {
    this.ruby = text;
    this.lineHeight = this.getFontSize() + this.getRubySize() + this.getRubyOffset();
  };

  setLink = async (params: ParameterCollection) => {
    const text: string = params.text;
    let rectangle: Rectangle | null = null;
    this.setText(text);
    for (let i = 0; i < this.remainingText.length; i++) {
      const character = this.remainingText[i];
      const characterRectangle = await this.writeCharacter(character);
      if (characterRectangle) {
        rectangle = margeRectangle(rectangle, characterRectangle);
      }
    }
    const context = this.fore.base?.getContext("2d");
    this.remainingText = "";
    if (!context || !rectangle) {
      return;
    }
    this.clickableAreas.push({
      area: rectangle,
      params,
    });
  };

  setEdit = (params: ParameterCollection, onInput: (value: string) => void) => {
    const actualSize = this.getSize();
    if (!actualSize) {
      return;
    }
    const ratio = this.props.width / actualSize.width;

    const input = document.createElement("input");
    this.fore.form?.appendChild(input);
    const fontSize = this.getFontSize();
    input.style.position = "absolute";
    input.style.fontSize = `${fontSize}px`;
    input.style.transformOrigin = "left top";
    if (params.length) {
      input.style.width = `${params.length}px`;
    }
    if (params.opacity) {
      let backgroundColor: ColorObject;
      if (params.bgcolor) {
        backgroundColor = integerToRgb(
          nullFallback(colorStringToInteger("" + params.bgcolor), 0xffffff)
        );
      } else {
        backgroundColor = {
          r: 0xff,
          g: 0xff,
          b: 0xff,
        };
      }
      input.style.background = `rgba(${backgroundColor.r},${backgroundColor.g
        },${backgroundColor.b},${+params.opacity / 100})`;
    }
    if (params.color) {
      input.style.color = integerToColorString(
        nullFallback(colorStringToInteger(params.color), 0x000000)
      );
    }
    const inputStyle = window.getComputedStyle(input);
    const height = parseInt(nullFallback(inputStyle.height, "0"));
    const y =
      this.currentCaretPosition.y +
      this.lineHeight -
      height -
      this.getLineSpacing() / 5;
    const x = this.currentCaretPosition.x;
    input.style.borderRadius = `${height * 0.2}px`;
    input.dataset["x"] = `${x}`;
    input.dataset["y"] = `${y}`;
    input.oninput = () => onInput(input.value);
    this.currentCaretPosition.x += input.offsetWidth + this.getPitch();
  };

  setFontColor = (color: string | number) => {
    if (typeof color === "string") {
      if (color === "default") {
        this.resetFont();
      } else {
        this.font = {
          ...this.font,
          color: nullFallback(colorStringToInteger(color), 0xffffff),
        };
      }
    } else if (typeof color === "number") {
      this.font = {
        ...this.font,
        color,
      };
    }
  };

  setFontSize = (size: string | number) => {
    this.font = {
      ...this.font,
      size: +size,
    };
    this.lineHeight = +size + this.getRubySize() + this.getRubyOffset();
  };

  setFontEdge = (edge: string | boolean) => {
    this.font = {
      ...this.font,
      edge: ("" + edge).toLowerCase() === "true",
    };
  };

  setFontEdgeColor = (edgeColor: string | number) => {
    if (typeof edgeColor === "string") {
      this.font = {
        ...this.font,
        edgeColor: nullFallback(colorStringToInteger(edgeColor), 0xffffff),
      };
    } else if (typeof edgeColor === "number") {
      this.font = {
        ...this.font,
        edgeColor: edgeColor,
      };
    }
  };

  setFontShadow = (shadow: string | boolean) => {
    this.font = {
      ...this.font,
      shadow: ("" + shadow).toLowerCase() === "true",
    };
  };

  resetFont = () => {
    this.font = { ...this.defaultFont };
  };

  resetAlignment = () => {
    this.textAlignment = Alignment.Default;
    this.afterSetAlignment = true;
  };

  setVisible = (visible: boolean) => {
    this.visible = visible;
    if (this.dom) {
      this.dom.style.display = visible ? "inherit" : "none";
    }
  };

  setAlignment = (alignment: Alignment | string) => {
    this.textAlignment = alignment as Alignment;
    this.afterSetAlignment = true;
  };

  setClickWaiting = (clickWaiting: boolean) => {
    this.clickWaiting = clickWaiting;
  };

  setSpeed = (speed: number) => {
    this.speed = speed;
  };

  setNoWait = (noWait: boolean) => {
    this.noWait = noWait;
  };

  setVertical = (vertical: boolean) => {
    this.vertical = vertical;
    this.recalculateCurrentCaretPosition();
  };

  recalculateCurrentCaretPosition = () => {
    if (this.vertical) {
      this.currentCaretPosition = {
        x: this.getMW() + this.getML() - this.getMarginL() - this.getFontSize(),
        y: this.getMarginT() + this.getMT(),
      };
    } else {
      this.currentCaretPosition = {
        x: this.getMarginL() + this.getML(),
        y: this.getMarginT() + this.getMT(),
      };
    }
  };

  setLeft = (left: number) => {
    this.ml = left;
  };

  setTop = (top: number) => {
    this.mt = top;
  };

  setMarginL = (marginL: number) => {
    this.marginL = marginL;
  };

  setMarginT = (marginT: number) => {
    this.marginT = marginT;
  };

  setMarginR = (marginR: number) => {
    this.marginR = marginR;
  };

  setMarginB = (marginB: number) => {
    this.marginB = marginB;
  };

  setFrame = (frame: HTMLImageElement) => {
    this.frame = frame;
    this.mw = this.frame.naturalWidth;
    this.mh = this.frame.naturalHeight;
    this.clear();
  };

  setOpacity = (opacity: number) => {
    if (this.fore.base) {
      this.fore.base.style.opacity = `${opacity}`;
    }
  };

  setShadow = (shadow: boolean) => {
    this.shadow = shadow;
  };

  setCurrentPage = (page: LayerPages.Fore) => {
    this.currentPage = page;
    if (this.fore.dom) {
      this.fore.dom.style.display =
        page === LayerPages.Fore ? "inherit" : "none";
    }
    if (this.back.dom) {
      this.back.dom.style.display =
        page === LayerPages.Fore ? "none" : "inherit";
    }
  };

  private getLineSpacing = () =>
    nullFallback(this.config.defaultLineSpacing, 6);
  private getPitch = () => nullFallback(this.config.defaultPitch, 0);
  private getFontColor = () =>
    nullFallback(
      this.font.color,
      nullFallback(this.defaultFont.color, 0xffffff)
    );
  private getEdgeColor = () =>
    nullFallback(
      this.font.edgeColor,
      nullFallback(this.defaultFont.edgeColor, 0xffffff)
    );
  private getML = () => nullFallback(this.ml, nullFallback(this.config.ml, 16));
  private getMT = () => nullFallback(this.mt, nullFallback(this.config.mt, 16));
  private getMW = () =>
    nullFallback(this.mw, nullFallback(this.config.mw, 608));
  private getMH = () =>
    nullFallback(this.mh, nullFallback(this.config.mh, 608));
  private getMarginL = () =>
    nullFallback(this.marginL, nullFallback(this.config.marginL, 8));
  private getMarginT = () =>
    nullFallback(this.marginT, nullFallback(this.config.marginT, 8));
  private getMarginR = () =>
    nullFallback(this.marginR, nullFallback(this.config.marginR, 8));
  private getMarginB = () =>
    nullFallback(this.marginB, nullFallback(this.config.marginB, 8));
  private getFontSize = () =>
    nullFallback(this.font.size, nullFallback(this.defaultFont.size, 24));
  private getFontItalic = () =>
    nullFallback(
      this.font.italic,
      nullFallback(this.defaultFont.italic, false)
    );
  private getFontBold = () =>
    nullFallback(this.font.bold, nullFallback(this.defaultFont.bold, true));
  private getFont = () =>
    `${this.getFontItalic() ? "italic" : ""} ${this.getFontBold() ? "bold" : ""
    } ${this.font.size}px '${this.font.face}'`;
  private getRubySize = () => nullFallback(this.font.rubySize, nullFallback(this.defaultFont.rubyOffset, 0));
  private getRubyOffset = () => nullFallback(this.font.rubyOffset, nullFallback(this.defaultFont.rubyOffset, 0));
  private getFrameColor = () => nullFallback(this.config.frameColor, 0x000000);
  private getFrameOpacity = () => nullFallback(this.config.frameOpacity, 0x80);
  private getLinkColor = (linkColor?: number | null) =>
    nullFallback(
      linkColor,
      nullFallback(this.config.defaultLinkColor, 0x000000)
    );
  private getSpeed = () => nullFallback(this.speed, 30);
  private getVertical = () =>
    nullFallback(this.vertical, nullFallback(this.config.vertical, false));
  private getDefaultAlignment = () =>
    this.vertical ? Alignment.Top : Alignment.Left;
  private getShadow = () =>
    nullFallback(this.shadow, nullFallback(this.font.shadow, true));
  private getShadowColor = () =>
    nullFallback(this.shadowColor, nullFallback(this.font.shadowColor, true));

  getVisible = () => {
    return this.visible;
  };

  getTransitionWorking = () => {
    return this.transitionWorking;
  };

  isTextRemaining = () => {
    return !!this.remainingText;
  };

  resize = (dom: HTMLElement | null) => {
    if (!dom) {
      return;
    }
    const clientWidth = document.body.clientWidth;
    const clientHeight = document.body.clientHeight;
    const ratio = this.props.height / this.props.width;

    if (ratio < clientHeight / clientWidth) {
      dom.style.height = `${clientWidth * ratio}px`;
      dom.style.width = `${clientWidth}px`;
    } else {
      dom.style.width = `${clientHeight / ratio}px`;
      dom.style.height = `${clientHeight}px`;
    }
  };

  resizeEdit = () => {
    this.messageLayerElementSetResizeEdit(this.back);
    this.messageLayerElementSetResizeEdit(this.fore);
  };

  private messageLayerElementSetResizeEdit = (
    messageLayerElementSet: MessageLayerElementSet
  ) => {
    if (!messageLayerElementSet.form) {
      return;
    }
    const actualSize = this.getSize();
    if (!actualSize) {
      return;
    }
    const ratio = actualSize.width / this.props.width;
    for (const element of Array.prototype.slice.call(
      messageLayerElementSet.form.children
    )) {
      const element2 = element as HTMLElement;
      element2.style.transform = `scale(${ratio})`;
      element2.style.left = `${+nullFallback(element2.dataset["x"], 0) * ratio
        }px`;
      element2.style.top = `${+nullFallback(element2.dataset["y"], 0) * ratio
        }px`;
    }
  };

  transition = async (
    method: string,
    time: number,
    setting: TransitionSetting
  ) => {
    this.transitionWorking = true;
    this.transitionWorking = false;
  };

  update = async () => {
    this.resize(this.back.base);
    this.resize(this.back.highlight);
    this.resize(this.back.form);
    this.resize(this.fore.base);
    this.resize(this.fore.highlight);
    this.resize(this.fore.form);
    this.resizeEdit();
    if (!this.clickWaiting) {
      for (let i = 0; i < this.remainingText.length; i++) {
        const character = this.remainingText[i];
        await this.writeCharacter(character);
      }
      this.remainingText = "";
    }
    if (this.processing) {
      return;
    }
    this.processing = true;
    if (this.clickWaiting) {
      if (!this.noWait) {
        await sleep(this.getSpeed());
      }
      const newText = this.remainingText.substring(1);
      const character = this.remainingText[0];
      await this.writeCharacter(character);
      this.remainingText = nullFallback(newText, "");
    }
    this.processing = false;
  };

  writePosition = async (width: number, height: number, proceedPosition: boolean = true) => {
    if (this.vertical) {
      console.log("%cVertical mode is under development", "color: orange");
      if (
        this.currentCaretPosition.y + height >
        this.getMH() + this.getMT() - this.getMarginB()
      ) {
        this.addCarriageReturn();
        this.afterSetAlignment = false;
      }
      if (
        this.currentCaretPosition.x - width <
        this.getML() + this.getMarginL()
      ) {
        this.remainingText = "";
        this.processing = false;
        return null;
      }
      const characterRectangle: Rectangle = {
        position: {
          x: this.currentCaretPosition.x - this.lineHeight + width,
          y: this.currentCaretPosition.y,
        },
        size: {
          width,
          height,
        },
      };

      if(proceedPosition) {
        this.currentCaretPosition.y += height + this.getPitch();
      }

      return characterRectangle;
    } else {
      if (
        this.currentCaretPosition.x + width >
        this.getMW() + this.getML() - this.getMarginR()
      ) {
        this.addCarriageReturn();
        this.afterSetAlignment = false;
      }
      if (
        this.currentCaretPosition.y + height >
        this.getMH() + this.getMT() - this.getMarginB()
      ) {
        this.remainingText = "";
        this.processing = false;
        return null;
      }
      const characterRectangle: Rectangle = {
        position: {
          x: this.currentCaretPosition.x,
          y: this.currentCaretPosition.y + this.lineHeight - height,
        },
        size: {
          width,
          height,
        },
      };

      if(proceedPosition) {
        this.currentCaretPosition.x += width + this.getPitch();
      }

      return characterRectangle;
    }
  };

  writeRuby = (
    context: CanvasRenderingContext2D,
    textAlign: CanvasTextAlign,
    textBaseline: CanvasTextBaseline,
    x: number,
    y: number
  ) => {
    const currentTextAlign = context.textAlign;
    const currentBaseline = context.textBaseline;
    const currentFont = context.font;
    context.textAlign = textAlign;
    context.textBaseline = textBaseline;
    context.font = `${this.font.rubySize}px ${this.font.face}`;
    context.fillText(this.ruby, x, y);
    this.setRuby("");
    context.textAlign = currentTextAlign;
    context.textBaseline = currentBaseline;
    context.font = currentFont;
  };

  writeCharacter = async (character: string) => {
    if (!character) {
      return null;
    }
    const context = this.fore.base?.getContext("2d");
    if (!context) {
      return null;
    }
    context.globalAlpha = 1;
    context.textAlign = "left";
    context.textBaseline = "top";
    context.font = this.getFont();
    const width = context.measureText(character).width;
    const height = this.getFontSize();

    if (this.vertical) {
      let xOffset = 0;
      let yOffset = 0;
      
      if (this.isCharacterRotated) {
        if(this.rotationAnchor) {
          context.translate(this.rotationAnchor.x, this.rotationAnchor.y);
          context.rotate(-Math.PI / 2);
          context.translate(-this.rotationAnchor.x, -this.rotationAnchor.y);
        }
        this.isCharacterRotated = false;
      }
      
      switch (true) {
        case /[、。]/.test(character): {
          xOffset = height * 0.7;
          yOffset = -height * 0.5;
          break;
        }
        case /[ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ]/.test(character): {
          xOffset = height * 0.1;
          yOffset = -height * 0.1;
          break;
        }
        case /[「『（【［〈《〔｛«‹〘〚｢{\[\(」』）】］〉》〕｝»›〙〛｣}\]\)]/.test(character): {
          if (!this.isCharacterRotated) {
            this.rotationAnchor = (await this.writePosition(width, height, false))?.position;
            if (this.rotationAnchor) {
              context.translate(this.rotationAnchor.x, this.rotationAnchor.y);
              context.rotate(Math.PI / 2);
              context.translate(-this.rotationAnchor.x, -this.rotationAnchor.y);
            }
          }
          yOffset = -height;
          this.isCharacterRotated = true;
          break;
        }
      }
      const x =
        this.currentCaretPosition.x -
        this.lineHeight -
        width -
        this.getLineSpacing() / 5;

      if (this.ruby) {
        this.writeRuby(
          context,
          "center",
          "middle",
          x,
          this.currentCaretPosition.y + height / 2
        );
      }
      const characterRectangle = await this.writePosition(width, height);
      if (!characterRectangle) {
        return null;
      }
      if (this.shadow) {
        context.fillStyle = integerToColorString(this.getShadowColor());
        context.fillText(
          character,
          characterRectangle.position.x + 2 + xOffset,
          characterRectangle.position.y + 2 + yOffset
        );
      }
      if (this.font.edge) {
        context.strokeStyle = integerToColorString(this.getEdgeColor());
        context.lineWidth = 2;
        context.strokeText(
          character,
          characterRectangle.position.x + xOffset,
          characterRectangle.position.y + yOffset
        );
      }
      context.fillStyle = integerToColorString(this.getFontColor());
      context.fillText(
        character,
        characterRectangle.position.x + xOffset,
        characterRectangle.position.y + yOffset
      );
      return characterRectangle;
    } else {
      const y =
        this.currentCaretPosition.y +
        this.lineHeight -
        height -
        this.getLineSpacing() / 5;

      if (this.ruby) {
        this.writeRuby(
          context,
          "center",
          "bottom",
          this.currentCaretPosition.x + width / 2,
          y
        );
      }
      const characterRectangle = await this.writePosition(width, height);
      if (!characterRectangle) {
        return null;
      }
      if (this.shadow) {
        context.fillStyle = integerToColorString(this.getShadowColor());
        context.fillText(
          character,
          characterRectangle.position.x + 2,
          characterRectangle.position.y + 2
        );
      }
      if (this.font.edge) {
        context.strokeStyle = integerToColorString(this.getEdgeColor());
        context.lineWidth = 2;
        context.strokeText(
          character,
          characterRectangle.position.x,
          characterRectangle.position.y
        );
      }
      context.fillStyle = integerToColorString(this.getFontColor());
      context.fillText(
        character,
        characterRectangle.position.x,
        characterRectangle.position.y
      );
      return characterRectangle;
    }
  };

  writeGraph = async (image: HTMLImageElement) => {
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const context = this.fore.base?.getContext("2d");
    const height2 = this.font.size || height;
    const ratio = height2 / height;
    const width2 = width * ratio;
    context?.drawImage(
      image,
      this.currentCaretPosition.x,
      this.currentCaretPosition.y + this.lineHeight - height2,
      width2,
      height2
    );
    await this.writePosition(width2, height2);
    this.afterSetAlignment = false;
  };

  calculateLeftMargin = (remainingWidth?: number): number => {
    const margin = this.getMarginL() + this.getML();
    if (!this.fore.base) {
      return margin;
    }
    const lineWidth = this.getMW() - margin - this.getMarginR();
    const context = this.fore.base.getContext("2d");
    if (!context) {
      return margin;
    }
    context.textAlign = "left";
    context.textBaseline = "top";
    context.font = this.getFont();
    const width = nullFallback(
      remainingWidth,
      context.measureText(this.remainingText).width
    );
    const fullWidth: boolean = this.currentCaretPosition.x + width > lineWidth;
    if (fullWidth) {
      return margin;
    }
    switch (this.textAlignment) {
      case Alignment.Default:
      case Alignment.Left: {
        return margin;
      }
      case Alignment.Center: {
        return (this.getMW() - width) / 2 + this.getML();
      }
      case Alignment.Right: {
        return this.getMW() + this.getML() - this.getMarginR() - width;
      }
      default: {
        return margin;
      }
    }
  };

  calculateTopMargin = (remainingHeight?: number): number => {
    const margin = this.getMarginT() + this.getMT();
    if (!this.fore.base) {
      return margin;
    }
    const lineHeight = this.getMH() - margin - this.getMarginB() + this.getRubySize() + this.getRubyOffset();
    const context = this.fore.base.getContext("2d");
    if (!context) {
      return margin;
    }
    context.textAlign = "left";
    context.textBaseline = "top";
    context.font = this.getFont();
    const height = nullFallback(
      remainingHeight,
      this.getFontSize() * this.remainingText.length
    );
    const fullHeight: boolean =
      this.currentCaretPosition.y + height > lineHeight;
    switch (this.textAlignment) {
      case Alignment.Default:
      case Alignment.Top: {
        return margin;
      }
      case Alignment.Center: {
        if (fullHeight) {
          return margin;
        } else {
          return (this.getMH() - height) / 2 + this.getMT();
        }
      }
      case Alignment.Bottom: {
        if (fullHeight) {
          return margin;
        } else {
          return this.getMH() + this.getMT() - this.getMarginB() - height;
        }
      }
    }
    return margin;
  };

  addCarriageReturn = () => {
    if (this.vertical) {
      this.currentLine++;
      this.currentCaretPosition.x -= this.lineHeight + this.getLineSpacing();
      this.currentCaretPosition.y = this.calculateTopMargin();
      this.lineHeight = this.getFontSize() + this.getRubySize() + this.getRubyOffset();
    } else {
      this.currentLine++;
      this.currentCaretPosition.x = this.calculateLeftMargin();
      this.currentCaretPosition.y += this.lineHeight + this.getLineSpacing();
      this.lineHeight = this.getFontSize() + this.getRubySize() + this.getRubyOffset();
    }
    this.afterSetAlignment = true;
  };

  clearBase = (page: MessageLayerElementSet) => {
    if (!page.base) {
      return;
    }
    const context = page.base.getContext("2d");
    if (context) {
      context.clearRect(0, 0, page.base.width, page.base.height);
      context.fillStyle = integerToColorString(this.getFrameColor());
      context.globalAlpha = this.getFrameOpacity() / 0xff;
      if (this.frame) {
        context.drawImage(this.frame, this.getML(), this.getMT());
      } else {
        context.fillRect(
          this.getML(),
          this.getMT(),
          this.getMW(),
          this.getMH()
        );
      }
    }
  };

  clear = () => {
    this.textAlignment = this.getDefaultAlignment();
    this.recalculateCurrentCaretPosition();
    this.clearBase(this.back);
    this.clearBase(this.fore);
    this.clearHighlight(this.back);
    this.clearHighlight(this.fore);
    this.lineWidths = [];
    this.currentLine = 0;
    this.clickableAreas = [];
    while (this.fore.form?.firstChild) {
      this.fore.form.firstChild.remove();
    }
  };

  mouseInClickableArea = (): ClickableAreaCollection | null => {
    if (!this.cursorPosition) {
      return null;
    }
    const mouseInClickableAreas = this.clickableAreas.filter(
      (clickableArea) =>
        this.cursorPosition &&
        positionIsInRectangle(this.cursorPosition, clickableArea.area)
    );
    if (mouseInClickableAreas.length > 0) {
      return mouseInClickableAreas;
    } else {
      return null;
    }
  };

  setCursorPosition = (position: Position) => {
    this.cursorPosition = position;
    const mouseInClickableAreas = this.mouseInClickableArea();
    this.clearHighlight(this.back);
    this.clearHighlight(this.fore);
    if (mouseInClickableAreas) {
      for (const clickableArea of mouseInClickableAreas) {
        this.highlightArea(clickableArea);
      }
    }
  };

  highlightArea = (clickableArea: ClickableArea) => {
    if (!this.fore.highlight) {
      return;
    }
    const context = this.fore.highlight.getContext("2d");
    if (!context) {
      return;
    }
    context.clearRect(
      0,
      0,
      this.fore.highlight.width,
      this.fore.highlight.height
    );
    context.globalAlpha = 0.2;
    context.fillStyle = integerToColorString(
      this.getLinkColor(colorStringToInteger(clickableArea.params.color))
    );
    context.fillRect(
      clickableArea.area.position.x,
      clickableArea.area.position.y,
      clickableArea.area.size.width,
      clickableArea.area.size.height
    );
    context.globalAlpha = 1;
  };

  clearHighlight = (page: MessageLayerElementSet) => {
    if (!page.highlight) {
      return;
    }
    const context = page.highlight.getContext("2d");
    if (context) {
      context.clearRect(0, 0, page.highlight.width, page.highlight.height);
    }
  };

  click = () => {
    const mouseInClickableAreas = this.mouseInClickableArea();
    if (!mouseInClickableAreas) {
      return null;
    }
    for (const clickableArea of mouseInClickableAreas) {
      return clickableArea.params;
    }
  };

  getSize = () => {
    if (!this.fore.base) {
      return null;
    }
    return {
      width: this.fore.base.offsetWidth,
      height: this.fore.base.offsetHeight,
    } as Size;
  };

  getPosition = () => {
    if (!this.fore.base) {
      return null;
    }
    return {
      x: this.fore.base.offsetLeft,
      y: this.fore.base.offsetTop,
    } as Position;
  };

  getNextChoicePosition = (currentPosition: Position) => {
    const nextCandidates = this.clickableAreas.filter(
      (clickableArea) => currentPosition.y < clickableArea.area.position.y
    );
    let nextArea: Rectangle;
    if (nextCandidates.length > 0) {
      nextArea = nextCandidates.reduce((previousValue, currentValue) => {
        if (
          previousValue.area.position.y < currentValue.area.position.y ||
          (previousValue.area.position.y === currentValue.area.position.y &&
            previousValue.area.position.x < currentValue.area.position.x)
        ) {
          return previousValue;
        } else {
          return currentValue;
        }
      }).area;
    } else {
      nextArea = this.clickableAreas.reduce((previousValue, currentValue) => {
        if (
          previousValue.area.position.y < currentValue.area.position.y ||
          (previousValue.area.position.y === currentValue.area.position.y &&
            previousValue.area.position.x < currentValue.area.position.x)
        ) {
          return previousValue;
        } else {
          return currentValue;
        }
      }).area;
    }
    return {
      x: nextArea.position.x + nextArea.size.width / 2,
      y: nextArea.position.y + nextArea.size.height / 2,
    } as Position;
  };

  getPreviousChoicePosition = (currentPosition: Position) => {
    const nextCandidates = this.clickableAreas.filter(
      (clickableArea) => currentPosition.y >= clickableArea.area.position.y
    );
    nextCandidates.pop();
    let nextArea: Rectangle;
    if (nextCandidates.length > 0) {
      nextArea = nextCandidates.reduce((previousValue, currentValue) => {
        if (
          previousValue.area.position.y > currentValue.area.position.y ||
          (previousValue.area.position.y === currentValue.area.position.y &&
            previousValue.area.position.x > currentValue.area.position.x)
        ) {
          return previousValue;
        } else {
          return currentValue;
        }
      }).area;
    } else {
      nextArea = this.clickableAreas.reduce((previousValue, currentValue) => {
        if (
          previousValue.area.position.y > currentValue.area.position.y ||
          (previousValue.area.position.y === currentValue.area.position.y &&
            previousValue.area.position.x > currentValue.area.position.x)
        ) {
          return previousValue;
        } else {
          return currentValue;
        }
      }).area;
    }
    return {
      x: nextArea.position.x + nextArea.size.width / 2,
      y: nextArea.position.y + nextArea.size.height / 2,
    } as Position;
  };

  copyForeToBack = () => { };

  render() {
    return (
      <div
        ref={(e) => {
          this.dom = e;
        }}
        className="message-layer"
        style={{ display: this.visible ? "inherit" : "none" }}
      >
        <div
          ref={(e) => {
            this.back.dom = e;
          }}
          style={{ display: "none" }}
        >
          <canvas
            ref={(e) => {
              this.back.base = e;
            }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: document.body.clientWidth,
            }}
            width={this.props.width}
            height={this.props.height}
          />
          <canvas
            ref={(e) => {
              this.back.highlight = e;
            }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: document.body.clientWidth,
            }}
            width={this.props.width}
            height={this.props.height}
          />
          <div
            ref={(e) => {
              this.back.form = e;
            }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: this.props.width,
              height: this.props.height,
              zIndex: 9999,
            }}
          />
        </div>
        <div
          ref={(e) => {
            this.fore.dom = e;
          }}
        >
          <canvas
            ref={(e) => {
              this.fore.base = e;
            }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: document.body.clientWidth,
            }}
            width={this.props.width}
            height={this.props.height}
          />
          <canvas
            ref={(e) => {
              this.fore.highlight = e;
            }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: document.body.clientWidth,
            }}
            width={this.props.width}
            height={this.props.height}
          />
          <div
            ref={(e) => {
              this.fore.form = e;
            }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: this.props.width,
              height: this.props.height,
              zIndex: 9999,
            }}
          />
        </div>
      </div>
    );
  }
}

export type MessageLayerCollection = (MessageLayer | null)[];
