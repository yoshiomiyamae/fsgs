import { Rectangle, ColorObject, Position } from "./models/fsgs-model";
// import NanoTimer from 'nanotimer';

// const timer = new NanoTimer();
export const sleep = (time: number) => {
  if (time < 4) {
    // 標準のsetTimeoutの最小msは4msなので、それ以下の場合はnanotimerを使う。
    // return new Promise(resolve => timer.setTimeout(resolve, '', `${Math.floor(time * 1000000)}n`));
    return new Promise(resolve => setTimeout(resolve, time));
  } else {
    // 標準のsetTimeoutの方がばらつきが少ないので基本はこちらを使う。
    return new Promise(resolve => setTimeout(resolve, time));
  }
}

export const integerToColorString = (value: number) => `#${`000000${value.toString(16)}`.slice(-6)}`;
export const colorStringToInteger = (value: string | null | undefined) => {
  if (value) {
    let temp: string = '';
    if (value[0] === '#') {
      temp = `0x${value.substring(1)}`;
    } else if (value.substr(0, 2) === '0x') {
      temp = value;
    }
    return parseInt(temp, 16);
  }
  return null;
}
export const integerToRgb = (value: number) => {
  return {
    r: value >> 16,
    g: (value >> 8) & 0xFF,
    b: value && 0xFF,
  } as ColorObject
}

export const margeRectangle = (rectangle1: Rectangle | null, rectangle2: Rectangle | null) => {
  if (!rectangle1) {
    return rectangle2;
  }
  if (!rectangle2) {
    return rectangle1;
  }
  const rectangle = {...rectangle1};
  if (rectangle.position.x > rectangle2.position.x) {
    rectangle.position.x = rectangle2.position.x;
  }
  if (rectangle.size.width < rectangle2.size.width + rectangle2.position.x - rectangle.position.x) {
    rectangle.size.width = rectangle2.size.width + rectangle2.position.x - rectangle.position.x;
  }
  if (rectangle.position.y > rectangle2.position.y) {
    rectangle.position.y = rectangle2.position.y;
  }
  if (rectangle.size.height < rectangle2.size.height + rectangle2.position.y - rectangle.position.y) {
    rectangle.size.height = rectangle2.size.height + rectangle2.position.y - rectangle.position.y;
  }

  return rectangle;
}

export const nullFallback = <T>(value: T | null | undefined, fallbackValue: any | null | undefined) => {
  if (value === undefined || value === null) {
    return <T>fallbackValue;
  } else {
    return <T>value;
  }
}

export const positionIsInRectangle = (position: Position, rectangle: Rectangle) => (
  position.x >= rectangle.position.x &&
  position.x <= rectangle.position.x + rectangle.size.width &&
  position.y >= rectangle.position.y &&
  position.y <= rectangle.position.y + rectangle.size.height
);

export const KEY_CODES = {
  BACKSPACE: 8,
  TAB: 9,
  ENTER: 13,
  SHIFT: 16,
  CTRL: 17,
  ALT: 18,
  PAUSE: 19,
  CAPS_LOCK: 20,
  ESCAPE: 27,
  SPACE: 32,
  PAGE_UP: 33,
  PAGE_DOWN: 34,
  END: 35,
  HOME: 36,
  LEFT_ARROW: 37,
  UP_ARROW: 38,
  RIGHT_ARROW: 39,
  DOWN_ARROW: 40,
  INSERT: 45,
  DELETE: 46,
  KEY_0: 48,
  KEY_1: 49,
  KEY_2: 50,
  KEY_3: 51,
  KEY_4: 52,
  KEY_5: 53,
  KEY_6: 54,
  KEY_7: 55,
  KEY_8: 56,
  KEY_9: 57,
  KEY_A: 65,
  KEY_B: 66,
  KEY_C: 67,
  KEY_D: 68,
  KEY_E: 69,
  KEY_F: 70,
  KEY_G: 71,
  KEY_H: 72,
  KEY_I: 73,
  KEY_J: 74,
  KEY_K: 75,
  KEY_L: 76,
  KEY_M: 77,
  KEY_N: 78,
  KEY_O: 79,
  KEY_P: 80,
  KEY_Q: 81,
  KEY_R: 82,
  KEY_S: 83,
  KEY_T: 84,
  KEY_U: 85,
  KEY_V: 86,
  KEY_W: 87,
  KEY_X: 88,
  KEY_Y: 89,
  KEY_Z: 90,
  LEFT_META: 91,
  RIGHT_META: 92,
  SELECT: 93,
  NUMPAD_0: 96,
  NUMPAD_1: 97,
  NUMPAD_2: 98,
  NUMPAD_3: 99,
  NUMPAD_4: 100,
  NUMPAD_5: 101,
  NUMPAD_6: 102,
  NUMPAD_7: 103,
  NUMPAD_8: 104,
  NUMPAD_9: 105,
  MULTIPLY: 106,
  ADD: 107,
  SUBTRACT: 109,
  DECIMAL: 110,
  DIVIDE: 111,
  F1: 112,
  F2: 113,
  F3: 114,
  F4: 115,
  F5: 116,
  F6: 117,
  F7: 118,
  F8: 119,
  F9: 120,
  F10: 121,
  F11: 122,
  F12: 123,
  NUM_LOCK: 144,
  SCROLL_LOCK: 145,
  SEMICOLON: 186,
  EQUALS: 187,
  COMMA: 188,
  DASH: 189,
  PERIOD: 190,
  FORWARD_SLASH: 191,
  GRAVE_ACCENT: 192,
  OPEN_BRACKET: 219,
  BACK_SLASH: 220,
  CLOSE_BRACKET: 221,
  SINGLE_QUOTE: 222
};