import * as React from "react";
import {
  Font,
  Position,
  Size,
  MessageLayerConfig,
  Alignment,
  ParameterSet,
  LinkCollection,
  Rectangle,
  Link,
  ColorObject,
  TransitionSetting,
  SetButtonArgs,
  ButtonCollection,
  ClickableAreaCollection,
  Button,
  isInstanceOfButton,
  isInstanceOfLink,
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

const CHARACTER_SET_1 = /[、。，､｡]/;
const CHARACTER_SET_2 = /[ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ]/;
const CHARACTER_SET_3 = /[「『（【［〈《〔｛〘〚＜」』）】］〉》〕｝〙〛＞；：｀]/;
const CHARACTER_SET_4 = /[«｢{\[\(<»｣}\]\)>ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!"#$%&'~=\-\^\\@`+*,./?_]/;
const CHARACTER_SET_5 = /[‹›;:]/;
const CHARACTER_SET_6 = /[”’]/;

export class MessageLayer extends React.Component<
  MessageLayerProps,
  MessageLayerProps
> {
  private m_dom: HTMLDivElement | null;
  private m_fore: MessageLayerElementSet;
  private m_back: MessageLayerElementSet;
  private m_remainingText: string;
  private m_config: MessageLayerConfig;
  private m_currentCaretPosition: Position;
  private m_speed?: number;
  private m_processing: boolean;
  private m_visible: boolean;
  private m_clickWaiting: boolean;
  private m_defaultFont: Font;
  private m_font: Font;
  private m_lineWidths: number[];
  private m_textAlignment: Alignment;
  private m_afterSetAlignment: boolean;
  private m_links: LinkCollection;
  private m_buttons: ButtonCollection;
  private m_cursorPosition: Position | null;
  private m_noWait: boolean;
  private m_ruby: string;
  private m_vertical: boolean;
  private m_ml: number;
  private m_mt: number;
  private m_mw: number;
  private m_mh: number;
  private m_marginL: number;
  private m_marginT: number;
  private m_marginR: number;
  private m_marginB: number;
  private m_frame: HTMLImageElement | null;
  private m_shadow: boolean;
  private m_shadowColor: number | null;
  private m_transitionWorking: boolean;
  private m_isCharacterRotated: boolean;
  private m_rotationAnchor: Position | undefined;

  constructor(props: MessageLayerProps) {
    super(props);
    this.m_dom = null;
    this.m_fore = {
      dom: null,
      base: null,
      highlight: null,
      form: null,
    };
    this.m_back = {
      dom: null,
      base: null,
      highlight: null,
      form: null,
    };
    this.m_remainingText = "";
    this.m_speed = props.speed;
    this.m_processing = false;
    this.m_visible = props.visible;
    this.m_clickWaiting = false;
    this.m_config = props.config;
    this.m_defaultFont = { ...this.m_config.defaultFont };
    this.m_font = { ...this.m_config.defaultFont };
    this.m_lineWidths = [];
    this.m_textAlignment = Alignment.Default;
    this.m_ml = this.ml;
    this.m_mt = this.mt;
    this.m_mw = this.mw;
    this.m_mh = this.mh;
    this.m_marginL = this.marginL;
    this.m_marginT = this.marginT;
    this.m_marginR = this.marginR;
    this.m_marginB = this.marginB;
    this.m_currentCaretPosition = {
      x: this.marginL + this.ml,
      y: this.marginT + this.mt,
    };
    this.m_afterSetAlignment = false;
    this.m_links = [];
    this.m_buttons = [];
    this.m_cursorPosition = null;
    this.m_noWait = false;
    this.m_ruby = "";
    this.m_vertical = this.vertical;
    this.m_frame = null;
    this.m_shadow = this.shadow;
    this.m_shadowColor = this.shadowColor;
    this.m_transitionWorking = false;
    this.m_isCharacterRotated = false;
    this.m_rotationAnchor = {
      x: 0,
      y: 0,
    }
  }

  set text(text: string) {
    const context = this.m_fore.base?.getContext("2d");
    const lineWidth = this.mw - this.marginR;
    let textWidth = context?.measureText(text).width;

    if (textWidth) {
      this.m_lineWidths = [];
      for (; textWidth >= lineWidth; textWidth -= lineWidth) {
        this.m_lineWidths.push(lineWidth);
      }
      if (textWidth !== 0) {
        this.m_lineWidths.push(textWidth);
      }
    }

    this.m_remainingText = text;
    if (!this.m_afterSetAlignment) {
      return;
    }
    if (this.m_vertical) {
      this.m_currentCaretPosition.y = this.calculateTopMargin();
    } else {
      this.m_currentCaretPosition.x = this.calculateLeftMargin();
    }
    this.m_afterSetAlignment = false;
  };

  get lineHeight() {
    return this.fontSize + this.rubySize + this.rubyOffset;
  }

  set ruby(text: string) {
    this.m_ruby = text;
  };

  set fontColor(color: string | number) {
    if (typeof color === "string") {
      if (color === "default") {
        this.resetFont();
      } else {
        this.m_font = {
          ...this.m_font,
          color: nullFallback(colorStringToInteger(color), 0xffffff),
        };
      }
    } else if (typeof color === "number") {
      this.m_font = {
        ...this.m_font,
        color,
      };
    }
  };

  set fontSize(size: string | number) {
    this.m_font = {
      ...this.m_font,
      size: +size,
    };
  };

  set fontEdge(edge: string | boolean) {
    this.m_font = {
      ...this.m_font,
      edge: ("" + edge).toLowerCase() === "true",
    };
  };

  set fontEdgeColor(edgeColor: string | number) {
    if (typeof edgeColor === "string") {
      this.m_font = {
        ...this.m_font,
        edgeColor: nullFallback(colorStringToInteger(edgeColor), 0xffffff),
      };
    } else if (typeof edgeColor === "number") {
      this.m_font = {
        ...this.m_font,
        edgeColor: edgeColor,
      };
    }
  };

  set fontShadow(shadow: string | boolean) {
    this.m_font = {
      ...this.m_font,
      shadow: ("" + shadow).toLowerCase() === "true",
    };
  };

  set visible(visible: boolean) {
    this.m_visible = visible;
    if (this.m_dom) {
      this.m_dom.style.display = visible ? "inherit" : "none";
    }
  };

  set alignment(alignment: Alignment | string) {
    this.m_textAlignment = alignment as Alignment;
    this.m_afterSetAlignment = true;
  };

  set clickWaiting(clickWaiting: boolean) {
    this.m_clickWaiting = clickWaiting;
  };

  set speed(speed: number) {
    this.m_speed = speed;
  };

  set noWait(noWait: boolean) {
    this.m_noWait = noWait;
  };

  set vertical(vertical: boolean) {
    console.log("%cVertical mode is under development", "color: orange");
    this.m_vertical = vertical;
    this.recalculateCurrentCaretPosition();
  };

  set left(left: number) {
    this.m_ml = left;
  };

  set top(top: number) {
    this.m_mt = top;
  };

  set marginL(marginL: number) {
    this.m_marginL = marginL;
  };

  set marginT(marginT: number) {
    this.m_marginT = marginT;
  };

  set marginR(marginR: number) {
    this.m_marginR = marginR;
  };

  set marginB(marginB: number) {
    this.m_marginB = marginB;
  };

  set frame(frame: HTMLImageElement) {
    this.m_frame = frame;
    this.m_mw = this.m_frame.naturalWidth;
    this.m_mh = this.m_frame.naturalHeight;
    this.clear();
  };

  set opacity(opacity: number) {
    if (this.m_fore.base) {
      this.m_fore.base.style.opacity = `${opacity}`;
    }
  };

  set shadow(shadow: boolean) {
    this.m_shadow = shadow;
  };

  set currentPage(page: LayerPages.Fore) {
    if (this.m_fore.dom) {
      this.m_fore.dom.style.display =
        page === LayerPages.Fore ? "inherit" : "none";
    }
    if (this.m_back.dom) {
      this.m_back.dom.style.display =
        page === LayerPages.Fore ? "none" : "inherit";
    }
  };
  get visible() {
    return this.m_visible;
  };

  get transitionWorking() {
    return this.m_transitionWorking;
  };

  get clickableAreaMouseIn(): ClickableAreaCollection | null {
    if (!this.m_cursorPosition) {
      return null;
    }
    const mouseInClickableAreas = [...this.m_links, ...this.m_buttons].filter(
      (clickableArea) =>
        this.m_cursorPosition &&
        positionIsInRectangle(this.m_cursorPosition, clickableArea.area)
    );
    if (mouseInClickableAreas.length > 0) {
      return mouseInClickableAreas;
    } else {
      return null;
    }
  };

  get clickableAreaMouseNotIn(): ClickableAreaCollection | null {
    if (!this.m_cursorPosition) {
      return null;
    }
    const mouseNotInClickableAreas = [...this.m_links, ...this.m_buttons].filter(
      (clickableArea) =>
        !this.m_cursorPosition ||
        !positionIsInRectangle(this.m_cursorPosition, clickableArea.area)
    );
    if (mouseNotInClickableAreas.length > 0) {
      return mouseNotInClickableAreas;
    } else {
      return null;
    }
  };

  set currentCaretPosition(position: Position) {
    const newPosition: Position = {
      x: position.x || this.m_currentCaretPosition.x,
      y: position.y || this.m_currentCaretPosition.y,
    }
    this.m_currentCaretPosition = newPosition;
  }

  set cursorPosition(position: Position) {
    const newPosition: Position = {
      x: position.x || this.m_cursorPosition?.x || 0,
      y: position.y || this.m_cursorPosition?.y || 0,
    }
    this.m_cursorPosition = newPosition;
    const mouseInClickableAreas = this.clickableAreaMouseIn;
    this.clearHighlight(this.m_back);
    this.clearHighlight(this.m_fore);
    if (mouseInClickableAreas) {
      for (const clickableArea of mouseInClickableAreas) {
        this.highlightArea(clickableArea);
      }
    }
    const mouseNotInClickableAreas = this.clickableAreaMouseNotIn;
    if (mouseNotInClickableAreas) {
      for (const clickableArea of mouseNotInClickableAreas) {
        if (isInstanceOfButton(clickableArea)) {
          this.drawButton(clickableArea);
        }
      }
    }
  };

  get size() {
    if (!this.m_fore.base) {
      return null;
    }
    return {
      width: this.m_fore.base.offsetWidth,
      height: this.m_fore.base.offsetHeight,
    } as Size;
  };

  get position() {
    if (!this.m_fore.base) {
      return null;
    }
    return {
      x: this.m_fore.base.offsetLeft,
      y: this.m_fore.base.offsetTop,
    } as Position;
  };

  private get lineSpacing() { return nullFallback(this.m_config.defaultLineSpacing, 6); }
  private get pitch() { return nullFallback(this.m_config.defaultPitch, 0); }
  get fontColor(): number {
    return nullFallback(
      this.m_font.color,
      nullFallback(this.m_defaultFont.color, 0xffffff)
    );
  }
  private get edgeColor() {
    return nullFallback(
      this.m_font.edgeColor,
      nullFallback(this.m_defaultFont.edgeColor, 0xffffff)
    );
  }
  private get ml() { return nullFallback(this.m_ml, nullFallback(this.m_config.ml, 16)); }
  private get mt() { return nullFallback(this.m_mt, nullFallback(this.m_config.mt, 16)); }
  private get mw() { return nullFallback(this.m_mw, nullFallback(this.m_config.mw, 608)); }
  private get mh() { return nullFallback(this.m_mh, nullFallback(this.m_config.mh, 608)); }
  get marginL() { return nullFallback(this.m_marginL, nullFallback(this.m_config.marginL, 8)); }
  get marginT() { return nullFallback(this.m_marginT, nullFallback(this.m_config.marginT, 8)); }
  get marginR() { return nullFallback(this.m_marginR, nullFallback(this.m_config.marginR, 8)); }
  get marginB() { return nullFallback(this.m_marginB, nullFallback(this.m_config.marginB, 8)); }
  get fontSize(): number { return nullFallback(this.m_font.size, nullFallback(this.m_defaultFont.size, 24)); }
  private get fontItalic() {
    return nullFallback(
      this.m_font.italic,
      nullFallback(this.m_defaultFont.italic, false)
    );
  }
  private get fontBold() { return nullFallback(this.m_font.bold, nullFallback(this.m_defaultFont.bold, true)); }
  private get font() {
    return `${this.fontItalic ? "italic" : ""} ${this.fontBold ? "bold" : ""
      } ${this.m_font.size}px '${this.m_font.face}'`;
  }
  private get rubySize() { return nullFallback(this.m_font.rubySize, nullFallback(this.m_defaultFont.rubyOffset, 0)); }
  private get rubyOffset() { return nullFallback(this.m_font.rubyOffset, nullFallback(this.m_defaultFont.rubyOffset, 0)); }
  private get frameColor() { return nullFallback(this.m_config.frameColor, 0x000000); }
  private get frameOpacity() { return nullFallback(this.m_config.frameOpacity, 0x80); }
  private getLinkColor = (linkColor?: number | null) =>
    nullFallback(
      linkColor,
      nullFallback(this.m_config.defaultLinkColor, 0x000000)
    );
  get speed() { return nullFallback(this.m_speed, 30); }
  get vertical() { return nullFallback(this.m_vertical, nullFallback(this.m_config.vertical, false)); }
  private get defaultAlignment() { return this.m_vertical ? Alignment.Top : Alignment.Left; }
  get shadow() { return nullFallback(this.m_shadow, nullFallback(this.m_font.shadow, true)); }
  private get shadowColor() { return nullFallback(this.m_shadowColor, nullFallback(this.m_font.shadowColor, true)); }
  get buttons() { return this.m_buttons }

  changeFont = (font: Font) => {
    this.m_config.defaultFont = font;
  };

  addLink = async (params: ParameterSet) => {
    const text: string = params.text;
    let rectangle: Rectangle | null = null;
    this.text = text;
    for (let i = 0; i < this.m_remainingText.length; i++) {
      const character = this.m_remainingText[i];
      const characterRectangle = await this.writeCharacter(character);
      if (characterRectangle) {
        rectangle = margeRectangle(rectangle, characterRectangle);
      }
    }
    const context = this.m_fore.base?.getContext("2d");
    this.m_remainingText = "";
    if (!context || !rectangle) {
      return;
    }
    this.m_links.push({
      link: 0,
      area: rectangle,
      params,
    });
  };

  addButton = async (args: SetButtonArgs) => {
    console.log("add button", args);
    if (!args.image) {
      return;
    }
    if (!this.m_fore.highlight) {
      return;
    }
    const image = args.image as HTMLImageElement;
    const width = image.naturalWidth / 3;
    const height = image.naturalHeight;
    const rectangle: Rectangle = {
      position: { ...this.m_currentCaretPosition },
      size: { width, height },
    }
    const button = {
      button: 0,
      area: rectangle,
      params: args,
    };
    this.m_buttons.push(button);
    console.log('Buttons', this.m_buttons);
    this.drawButton(button);
  };

  addEdit = (params: ParameterSet, onInput: (value: string) => void) => {
    const actualSize = this.size;
    if (!actualSize) {
      return;
    }
    const ratio = this.props.width / actualSize.width;

    const input = document.createElement("input");
    this.m_fore.form?.appendChild(input);
    const fontSize = this.fontSize;
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
      this.m_currentCaretPosition.y +
      this.lineHeight -
      height -
      this.lineSpacing / 5;
    const x = this.m_currentCaretPosition.x;
    input.style.borderRadius = `${height * 0.2}px`;
    input.dataset["x"] = `${x}`;
    input.dataset["y"] = `${y}`;
    input.oninput = () => onInput(input.value);
    this.m_currentCaretPosition.x += input.offsetWidth + this.pitch;
  };

  resetFont = () => {
    this.m_font = { ...this.m_defaultFont };
  };

  resetAlignment = () => {
    this.m_textAlignment = Alignment.Default;
    this.m_afterSetAlignment = true;
  };

  recalculateCurrentCaretPosition = () => {
    if (this.m_vertical) {
      this.m_currentCaretPosition = {
        x: this.mw + this.ml - this.marginL - this.fontSize,
        y: this.marginT + this.mt,
      };
    } else {
      this.m_currentCaretPosition = {
        x: this.marginL + this.ml,
        y: this.marginT + this.mt,
      };
    }
  };

  isTextRemaining = () => {
    return !!this.m_remainingText;
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
    this.messageLayerElementSetResizeEdit(this.m_back);
    this.messageLayerElementSetResizeEdit(this.m_fore);
  };

  private messageLayerElementSetResizeEdit = (
    messageLayerElementSet: MessageLayerElementSet
  ) => {
    if (!messageLayerElementSet.form) {
      return;
    }
    const actualSize = this.size;
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
    this.m_transitionWorking = true;
    this.m_transitionWorking = false;
  };

  update = async () => {
    this.resize(this.m_back.base);
    this.resize(this.m_back.highlight);
    this.resize(this.m_back.form);
    this.resize(this.m_fore.base);
    this.resize(this.m_fore.highlight);
    this.resize(this.m_fore.form);
    this.resizeEdit();
    if (!this.m_clickWaiting) {
      for (let i = 0; i < this.m_remainingText.length; i++) {
        const character = this.m_remainingText[i];
        await this.writeCharacter(character);
      }
      this.m_remainingText = "";
    }
    if (this.m_processing) {
      return;
    }
    this.m_processing = true;
    if (this.m_clickWaiting) {
      if (!this.m_noWait) {
        await sleep(this.speed);
      }
      const newText = this.m_remainingText.substring(1);
      const character = this.m_remainingText[0];
      await this.writeCharacter(character);
      this.m_remainingText = nullFallback(newText, "");
    }
    this.m_processing = false;
  };

  writePosition = async (width: number, height: number, proceedPosition: boolean = true) => {
    if (this.m_vertical) {
      if (
        this.m_currentCaretPosition.y + height >
        this.mh + this.mt - this.marginB
      ) {
        this.addCarriageReturn();
        this.m_afterSetAlignment = false;
      }
      if (
        this.m_currentCaretPosition.x - width <
        this.ml + this.marginL
      ) {
        this.m_remainingText = "";
        this.m_processing = false;
        return null;
      }
      const characterRectangle: Rectangle = {
        position: {
          x: this.m_currentCaretPosition.x - this.lineHeight + width,
          y: this.m_currentCaretPosition.y,
        },
        size: {
          width,
          height,
        },
      };

      if (proceedPosition) {
        this.m_currentCaretPosition.y += height + this.pitch;
      }

      return characterRectangle;
    } else {
      if (
        this.m_currentCaretPosition.x + width >
        this.mw + this.ml - this.marginR
      ) {
        this.addCarriageReturn();
        this.m_afterSetAlignment = false;
      }
      if (
        this.m_currentCaretPosition.y + height >
        this.mh + this.mt - this.marginB
      ) {
        this.m_remainingText = "";
        this.m_processing = false;
        return null;
      }
      const characterRectangle: Rectangle = {
        position: {
          x: this.m_currentCaretPosition.x,
          y: this.m_currentCaretPosition.y + this.lineHeight - height,
        },
        size: {
          width,
          height,
        },
      };

      if (proceedPosition) {
        this.m_currentCaretPosition.x += width + this.pitch;
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
    context.font = `${this.m_font.rubySize}px ${this.m_font.face}`;
    context.fillText(this.m_ruby, x, y);
    this.ruby = "";
    context.textAlign = currentTextAlign;
    context.textBaseline = currentBaseline;
    context.font = currentFont;
  };

  characterRotation = (context: CanvasRenderingContext2D, back: boolean = false) => {
    if (this.m_rotationAnchor) {
      context.translate(this.m_rotationAnchor.x, this.m_rotationAnchor.y);
      context.rotate(Math.PI / 2 * (back ? -1 : 1));
      context.translate(-this.m_rotationAnchor.x, -this.m_rotationAnchor.y);
    }
  }

  writeCharacter = async (character: string) => {
    if (!character) {
      return null;
    }
    const context = this.m_fore.base?.getContext("2d");
    if (!context) {
      return null;
    }
    context.globalAlpha = 1;
    context.textAlign = "left";
    context.textBaseline = "top";
    context.font = this.font;
    const width = context.measureText(character).width;
    let height = this.fontSize;

    if (this.m_vertical) {
      let xOffset = 0;
      let yOffset = 0;

      switch (true) {
        case CHARACTER_SET_1.test(character): {
          xOffset = height * 0.7;
          yOffset = -height * 0.5;
          break;
        }
        case CHARACTER_SET_2.test(character): {
          xOffset = height * 0.1;
          yOffset = -height * 0.1;
          break;
        }
        case CHARACTER_SET_3.test(character): {
          yOffset = -height;
          break;
        }
        case CHARACTER_SET_4.test(character): {
          yOffset = -height * 1.5;
          height /= 2;
          break;
        }
        case CHARACTER_SET_5.test(character): {
          xOffset = height * 0.5;
          yOffset = -height * 1.7;
          break;
        }
        case CHARACTER_SET_6.test(character): {
          xOffset = height * 0.5;
          break;
        }
      }

      // FIXME: When the character is CHARACTER_SET_6,
      //        and meaning the end of quotation,
      //        the character should be shift to right.

      if ((new RegExp(CHARACTER_SET_3.source + '|' + CHARACTER_SET_4.source + '|' + CHARACTER_SET_5.source)).test(character)) {
        if (!this.m_isCharacterRotated) {
          this.m_rotationAnchor = (await this.writePosition(width, height, false))?.position;
          this.characterRotation(context);
        }
        this.m_isCharacterRotated = true;
      }

      const x =
        this.m_currentCaretPosition.x -
        this.lineHeight -
        width -
        this.lineSpacing / 5;

      if (this.m_ruby) {
        this.writeRuby(
          context,
          "center",
          "middle",
          x,
          this.m_currentCaretPosition.y + height / 2
        );
      }
      const characterRectangle = await this.writePosition(width, height);
      if (!characterRectangle) {
        return null;
      }
      if (this.m_shadow) {
        context.fillStyle = integerToColorString(this.shadowColor);
        context.fillText(
          character,
          characterRectangle.position.x + 2 + xOffset,
          characterRectangle.position.y + 2 + yOffset
        );
      }
      if (this.m_font.edge) {
        context.strokeStyle = integerToColorString(this.edgeColor);
        context.lineWidth = 2;
        context.strokeText(
          character,
          characterRectangle.position.x + xOffset,
          characterRectangle.position.y + yOffset
        );
      }
      context.fillStyle = integerToColorString(this.fontColor);
      context.fillText(
        character,
        characterRectangle.position.x + xOffset,
        characterRectangle.position.y + yOffset
      );

      if (this.m_isCharacterRotated) {
        this.characterRotation(context, true);
        this.m_isCharacterRotated = false;
      }

      return characterRectangle;
    } else {
      const y =
        this.m_currentCaretPosition.y +
        this.lineHeight -
        height -
        this.lineSpacing / 5;

      if (this.m_ruby) {
        this.writeRuby(
          context,
          "center",
          "bottom",
          this.m_currentCaretPosition.x + width / 2,
          y
        );
      }
      const characterRectangle = await this.writePosition(width, height);
      if (!characterRectangle) {
        return null;
      }
      if (this.m_shadow) {
        context.fillStyle = integerToColorString(this.shadowColor);
        context.fillText(
          character,
          characterRectangle.position.x + 2,
          characterRectangle.position.y + 2
        );
      }
      if (this.m_font.edge) {
        context.strokeStyle = integerToColorString(this.edgeColor);
        context.lineWidth = 2;
        context.strokeText(
          character,
          characterRectangle.position.x,
          characterRectangle.position.y
        );
      }
      context.fillStyle = integerToColorString(this.fontColor);
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
    const context = this.m_fore.base?.getContext("2d");
    const height2 = this.m_font.size || height;
    const ratio = height2 / height;
    const width2 = width * ratio;
    context?.drawImage(
      image,
      this.m_currentCaretPosition.x,
      this.m_currentCaretPosition.y + this.lineHeight - height2,
      width2,
      height2
    );
    await this.writePosition(width2, height2);
    this.m_afterSetAlignment = false;
  };

  calculateLeftMargin = (remainingWidth?: number): number => {
    const margin = this.marginL + this.ml;
    if (!this.m_fore.base) {
      return margin;
    }
    const lineWidth = this.mw - margin - this.marginR;
    const context = this.m_fore.base.getContext("2d");
    if (!context) {
      return margin;
    }
    context.textAlign = "left";
    context.textBaseline = "top";
    context.font = this.font;
    const width = nullFallback(
      remainingWidth,
      context.measureText(this.m_remainingText).width
    );
    const fullWidth: boolean = this.m_currentCaretPosition.x + width > lineWidth;
    if (fullWidth) {
      return margin;
    }
    switch (this.m_textAlignment) {
      case Alignment.Default:
      case Alignment.Left: {
        return margin;
      }
      case Alignment.Center: {
        return (this.mw - width) / 2 + this.ml;
      }
      case Alignment.Right: {
        return this.mw + this.ml - this.marginR - width;
      }
      default: {
        return margin;
      }
    }
  };

  calculateTopMargin = (remainingHeight?: number): number => {
    const margin = this.marginT + this.mt;
    if (!this.m_fore.base) {
      return margin;
    }
    const lineHeight = this.mh - margin - this.marginB + this.rubySize + this.rubyOffset;
    const context = this.m_fore.base.getContext("2d");
    if (!context) {
      return margin;
    }
    context.textAlign = "left";
    context.textBaseline = "top";
    context.font = this.font;
    const height = nullFallback(
      remainingHeight,
      this.fontSize * this.m_remainingText.length
    );
    const fullHeight: boolean =
      this.m_currentCaretPosition.y + height > lineHeight;
    switch (this.m_textAlignment) {
      case Alignment.Default:
      case Alignment.Top: {
        return margin;
      }
      case Alignment.Center: {
        if (fullHeight) {
          return margin;
        } else {
          return (this.mh - height) / 2 + this.mt;
        }
      }
      case Alignment.Bottom: {
        if (fullHeight) {
          return margin;
        } else {
          return this.mh + this.mt - this.marginB - height;
        }
      }
    }
    return margin;
  };

  addCarriageReturn = () => {
    if (this.m_vertical) {
      this.m_currentCaretPosition.x -= this.lineHeight + this.lineSpacing;
      this.m_currentCaretPosition.y = this.calculateTopMargin();
    } else {
      this.m_currentCaretPosition.x = this.calculateLeftMargin();
      this.m_currentCaretPosition.y += this.lineHeight + this.lineSpacing;
    }
    this.m_afterSetAlignment = true;
  };

  clearBase = (page: MessageLayerElementSet) => {
    if (!page.base) {
      return;
    }
    const context = page.base.getContext("2d");
    if (context) {
      context.clearRect(0, 0, page.base.width, page.base.height);
      context.fillStyle = integerToColorString(this.frameColor);
      context.globalAlpha = this.frameOpacity / 0xff;
      if (this.m_frame) {
        context.drawImage(this.m_frame, this.ml, this.mt);
      } else {
        context.fillRect(
          this.ml,
          this.mt,
          this.mw,
          this.mh
        );
      }
    }
  };

  clear = () => {
    this.m_textAlignment = this.defaultAlignment;
    this.recalculateCurrentCaretPosition();
    this.clearBase(this.m_back);
    this.clearBase(this.m_fore);
    this.clearHighlight(this.m_back);
    this.clearHighlight(this.m_fore);
    this.m_lineWidths = [];
    this.m_links = [];
    this.m_buttons = [];
    while (this.m_fore.form?.firstChild) {
      this.m_fore.form.firstChild.remove();
    }
  };

  drawButton = (button: Button, cursorOn: boolean = false) => {
    if (!button.params.image) {
      return;
    }
    if (!this.m_fore.highlight) {
      return;
    }
    const context = this.m_fore.highlight.getContext("2d");
    if (!context) {
      return;
    }
    const image = button.params.image as HTMLImageElement;
    context.drawImage(
      image,
      cursorOn ? button.area.size.width * 2 : 0,
      0,
      button.area.size.width,
      button.area.size.height,
      button.area.position.x,
      button.area.position.y,
      button.area.size.width,
      button.area.size.height,
    );
  }

  highlightArea = (clickableArea: Link | Button) => {
    if (!this.m_fore.highlight) {
      return;
    }
    const context = this.m_fore.highlight.getContext("2d");
    if (!context) {
      return;
    }
    context.clearRect(
      0,
      0,
      this.m_fore.highlight.width,
      this.m_fore.highlight.height
    );
    if (isInstanceOfLink(clickableArea)) {
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
    } else if (isInstanceOfButton(clickableArea)) {
      this.drawButton(clickableArea, true);
    }
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
    const mouseInClickableAreas = this.clickableAreaMouseIn;
    if (!mouseInClickableAreas) {
      return null;
    }
    for (const clickableArea of mouseInClickableAreas) {
      return clickableArea.params;
    }
  };

  getNextChoicePosition = (currentPosition: Position) => {
    const nextCandidates = this.m_links.filter(
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
      nextArea = this.m_links.reduce((previousValue, currentValue) => {
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
    const nextCandidates = this.m_links.filter(
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
      nextArea = this.m_links.reduce((previousValue, currentValue) => {
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
          this.m_dom = e;
        }}
        className="message-layer"
        style={{ display: this.m_visible ? "inherit" : "none" }}
      >
        <div
          ref={(e) => {
            this.m_back.dom = e;
          }}
          style={{ display: "none" }}
        >
          <canvas
            ref={(e) => {
              this.m_back.base = e;
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
              this.m_back.highlight = e;
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
              this.m_back.form = e;
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
            this.m_fore.dom = e;
          }}
        >
          <canvas
            ref={(e) => {
              this.m_fore.base = e;
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
              this.m_fore.highlight = e;
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
              this.m_fore.form = e;
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
