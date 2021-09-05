import { Config, MessageLayerConfig } from "../models/fsgs-model";

export const messageLayerConfigDefault: MessageLayerConfig = {
  frameGraphic: "",
  frameColor: 0x000000,
  frameOpacity: 0x80,
  marginL: 16,
  marginT: 16,
  marginR: 16,
  marginB: 16,
  ml: 16,
  mt: 16,
  mw: 1248,
  mh: 928,
  defaultAutoReturn: true,
  marginRCh: 2,
  defaultFont: {
    size: 48,
    face: "ＭＳ ゴシック",
    color: 0xffffff,
    italic: false,
    bold: true,
    rubySize: 20,
    rubyOffset: -2,
    antialiased: true,
    shadowColor: 0x000000,
    edgeColor: 0x000000,
    shadow: true,
    edge: false,
  },
  defaultLineSpacing: 6,
  defaultPitch: 0,
  lineBreakGlyph: "LineBreak",
  pageBreakGlyph: "PageBreak",
  glyphFixedPosition: false,
  glyphFixedLeft: 0,
  glyphFixedTop: 0,
  defaultLinkColor: 0x0080ff,
  defaultLinkOpacity: 0x40,
  vertical: false,
  draggable: false,
};
export const config: Config = {
  configVersion: "3.32 stable",
  title: "FSGS",
  ignoreCR: true,
  graphicCacheLimit: 0,
  windowConfig: {
    scWidth: 1280,
    scHeight: 960,
    readOnlyMode: false,
    freeSaveDataMode: false,
    saveThumbnail: false,
    thumbnailWidth: 133,
    thumbnailDepth: 8,
    dataName: "data",
    saveDataID: "00000000-0000-0000-0000-000000000000",
    saveDataMode: "",
    saveMacros: true,
    chSpeeds: {
      fast: 10,
      normal: 30,
      slow: 50,
    },
    autoModePageWaits: {
      fast: 400,
      faster: 700,
      medium: 1000,
      slower: 1300,
      slow: 2000,
    },
    autoModeLineWaits: {
      fast: 180,
      faster: 240,
      medium: 300,
      slower: 360,
      slow: 500,
    },
    cursorDefault: "Arrow",
    cursorPointed: "HandPoint",
    cursorWaitingClick: "Arrow",
    cursorDraggable: "SizeAll",
    autoRecordPageShowing: true,
    recordHistoryOfStore: 0,
    maxHistoryOfStore: 5,
    defaultQuakeTimeInChUnit: false,
    numSEBuffers: 3,
    numMovies: 1,
    numCharacterLayers: 3,
    scPositionX: {
      left: 160,
      leftCenter: 240,
      center: 320,
      rightCenter: 400,
      right: 480,
    },
    numMessageLayers: 2,
    initialMessageLayerVisible: true,
    numBookMarks: 10,
    showBookMarkDate: true,
    showFixedPitchOnlyInFontSelector: false,
    helpFile: "readme.txt",
    aboutWidth: 320,
    aboutHeight: 200,
  },
  menuVisibleConfig: {
    menu: true,
    rightClickMenuItem: true,
    showHistoryMenuItem: true,
    skipToNextStopMenuItem: true,
    autoModeMenuItem: true,
    autoModeWaitMenu: true,
    goBackMenuItem: true,
    goToStartMenuItem: true,
    characterMenu: true,
    chNonStopToPageBreakItem: true,
    ch2ndSpeedMenu: true,
    ch2ndNonStopToPageBreakItem: true,
    chAntialiasMenuItem: true,
    chChangeFontMenuItem: true,
    restoreMenu: true,
    storeMenu: true,
    displayMenu: true,
    helpMenu: false,
    helpIndexMenuItem: true,
    helpAboutMenuItem: true,
    debugMenu: false,
  },
  messageLayerConfig: messageLayerConfigDefault,
  bgmConfig: {
    doubleBuffered: true,
  },
  historyLayerConfig: {
    fontName: "ＭＳ ゴシック",
    fontBold: true,
    fontHeight: 24,
    lineHeight: 26,
    verticalView: false,
    everypage: false,
    autoReturn: true,
    maxPages: 100,
    maxLines: 2000,
    storeState: false,
  },
};

export default config;
