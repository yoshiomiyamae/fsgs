import { FileTypeResult } from "file-type";

export type Indices = { [key: string]: number };
export class Script {
  scenario: OperationCollection;
  labelIndices: Indices;
  macroIndices: Indices;

  constructor() {
    this.scenario = [];
    this.labelIndices = {};
    this.macroIndices = {};
  }
}
export type OperationCollection = Operation[];
export interface Operation {
  action: string;
  params: ParameterCollection;
}

export type ParameterCollection = { [key: string]: any };

export interface Config {
  configVersion?: string;
  title?: string;
  ignoreCR?: boolean;
  graphicCacheLimit?: number;
  windowConfig?: WindowConfig;
  menuVisibleConfig?: MenuVisibleConfig;
  messageLayerConfig?: MessageLayerConfig;
  bgmConfig?: BgmConfig;
  historyLayerConfig?: HistoryLayerConfig;
}

export interface WindowConfig {
  scWidth?: number;
  scHeight?: number;
  readOnlyMode?: boolean;
  freeSaveDataMode?: boolean;
  saveThumbnail?: boolean;
  thumbnailWidth?: number;
  thumbnailDepth?: number;
  dataName?: string;
  saveDataID?: string;
  saveDataMode?: string;
  saveMacros?: boolean;
  chSpeeds?: Speed;
  autoModePageWaits?: Speed;
  autoModeLineWaits?: Speed;
  cursorDefault?: Cursor | string;
  cursorPointed?: Cursor | string;
  cursorWaitingClick?: Cursor | string;
  cursorDraggable?: Cursor | string;
  autoRecordPageShowing?: boolean;
  recordHistoryOfStore?: number;
  maxHistoryOfStore?: number;
  defaultQuakeTimeInChUnit?: boolean;
  numSEBuffers?: number;
  numMovies?: number;
  numCharacterLayers?: number;
  scPositionX?: { [key: string]: number };
  numMessageLayers?: number;
  initialMessageLayerVisible?: boolean;
  numBookMarks?: number;
  showBookMarkDate?: boolean;
  showFixedPitchOnlyInFontSelector?: boolean;
  helpFile?: string;
  aboutWidth?: number;
  aboutHeight?: number;
}

export interface MenuVisibleConfig {
  menu?: boolean;
  rightClickMenuItem?: boolean;
  showHistoryMenuItem?: boolean;
  skipToNextStopMenuItem?: boolean;
  autoModeMenuItem?: boolean;
  autoModeWaitMenu?: boolean;
  goBackMenuItem?: boolean;
  goToStartMenuItem?: boolean;
  characterMenu?: boolean;
  chNonStopToPageBreakItem?: boolean;
  ch2ndSpeedMenu?: boolean;
  ch2ndNonStopToPageBreakItem?: boolean;
  chAntialiasMenuItem?: boolean;
  chChangeFontMenuItem?: boolean;
  restoreMenu?: boolean;
  storeMenu?: boolean;
  displayMenu?: boolean;
  helpMenu?: boolean;
  helpIndexMenuItem?: boolean;
  helpAboutMenuItem?: boolean;
  debugMenu?: boolean;
}

export interface MessageLayerConfig {
  frameGraphic?: string;
  frameColor?: number;
  frameOpacity?: number;
  marginL?: number;
  marginT?: number;
  marginR?: number;
  marginB?: number;
  ml?: number;
  mt?: number;
  mw?: number;
  mh?: number;
  defaultAutoReturn?: boolean;
  marginRCh?: number;
  defaultFont?: Font;
  defaultLineSpacing?: number;
  defaultPitch?: number;
  lineBreakGlyph?: string;
  pageBreakGlyph?: string;
  glyphFixedPosition?: boolean;
  glyphFixedLeft?: number;
  glyphFixedTop?: number;
  defaultLinkColor?: number;
  defaultLinkOpacity?: number;
  vertical?: boolean;
  draggable?: boolean;
}

export interface ImageLayerConfig {
  page: Page;
  key: number;
  mode: SyntheticMode;
  grayscale: boolean;
  rgamma: number;
  ggamma: number;
  bgamma: number;
  rfloor: number;
  gfloor: number;
  bfloor: number;
  rceil: number;
  gceil: number;
  bceil: number;
  mcolor: number;
  mopacity: number;
  lightType: SyntheticMode;
  shadow: number;
  shadowOpacity: number;
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  clipLeft: number;
  clipTop: number;
  clipWidth: number;
  clipHeight: number;
  flipUpDown: boolean;
  flipLeftRight: boolean;
  visible: boolean;
  left: number;
  top: number;
  // pos:
}

export type Page = "back" | "fore";
export type SyntheticMode =
  | "alpha"
  | "transp"
  | "opaque"
  | "rect"
  | "add"
  | "sub"
  | "mul"
  | "dodge"
  | "darken"
  | "lighten"
  | "screen"
  | "psadd"
  | "pssub"
  | "psmul"
  | "psscreen"
  | "psoverlay"
  | "pshlight"
  | "psslight"
  | "psdodge"
  | "psdodge5"
  | "psburn"
  | "pslighten"
  | "psdarken"
  | "psdiff"
  | "psdiff5"
  | "psexcl";

export interface BgmConfig {
  doubleBuffered?: boolean;
}

export interface HistoryLayerConfig {
  fontName?: string;
  fontBold?: boolean;
  fontHeight?: number;
  lineHeight?: number;
  verticalView?: boolean;
  everypage?: boolean;
  autoReturn?: boolean;
  maxPages?: number;
  maxLines?: number;
  storeState?: boolean;
}

export interface Speed {
  fast?: number;
  faster?: number;
  normal?: number;
  medium?: number;
  slower?: number;
  slow?: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Margin {
  left: number;
  top: number;
  bottom: number;
  right: number;
}

export interface Rectangle {
  size: Size;
  position: Position;
}

export interface ClickableArea {
  area: Rectangle;
  params: ParameterCollection;
}

export type ClickableAreaCollection = ClickableArea[];

export interface Button {
  area: Rectangle,
  params: SetButtonArgs,
}

export type ButtonCollection = Button[];

export enum Cursor {
  Arrow,
  HandPoint,
  SizeAll,
}

export interface Font {
  face?: string;
  size?: number;
  color?: number;
  italic?: boolean;
  rubySize?: number;
  rubyOffset?: number;
  shadow?: boolean;
  edge?: boolean;
  edgeColor?: number;
  shadowColor?: number;
  bold?: boolean;
  antialiased?: boolean;
}

export enum Direction {
  Left = "left",
  Right = "right",
  Top = "top",
  Bottom = "bottom",
}

export enum Alignment {
  Left = "left",
  Right = "right",
  Top = "top",
  Bottom = "bottom",
  Center = "center",
  Default = "default",
}

export enum StayValue {
  StayFore = "stayfore",
  StayBack = "stayback",
  NoStay = "nostay",
}

export interface SetImageArgs {
  layer: "base" | "graph" | "message" | "transition" | "button";
  page?: LayerPages;
  layerNumber?: number;
  left?: number;
  top?: number;
  data: string;
}

export interface SetButtonArgs {
  image?: HTMLImageElement | string,
  graphicKey?: number | "adapt",
  storage?: string,
  target?: string,
  recthit?: boolean,
  exp?: string,
  hint?: string,
  onEnter?: Function,
  onLeave?: Function,
  countPage?: boolean,
  clickSE?: string,
  clickSEBuf?: number,
  enterSE?: string,
  enterSEBuf?: number,
  leaveSE?: string,
  leaveSEBuf?: number,
}

export interface SetRuleTransitionArgs {
  layer: "base" | "message";
  layerNumber: number;
  time: number;
  vague: number;
  data: string;
  fileType: FileTypeResult;
}

export interface SetScriptArgs {
  script: Script;
  filePath: string;
  startFrom: string | number;
  offset: number;
}

export interface SetDataArgs {
  data: string;
  for: string;
  loop: boolean;
  fileType: FileTypeResult;
}

export interface ColorObject {
  r: number;
  g: number;
  b: number;
}

export interface LayerNumber {
  type: LayerTypes;
  number: number;
}

export interface StackItem {
  scriptName: string;
  programCounter: number;
}

export enum LayerTypes {
  Base = "base",
  Message = "message",
  Character = "character",
}

export interface TransitionSetting {
  rule?: HTMLImageElement;
  vague?: number;
  from?: Direction;
  stay?: StayValue;
}

export enum LayerPages {
  Fore = "fore",
  Back = "back",
}
