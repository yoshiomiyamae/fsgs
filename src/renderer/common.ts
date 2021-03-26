import { Rectangle, ColorObject, Position } from "./models/fsgs-model";
// import NanoTimer from 'nanotimer';

// const timer = new NanoTimer();
export const sleep = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time));

export const integerToColorString = (value: number) =>
  `#${`000000${value.toString(16)}`.slice(-6)}`;
export const colorStringToInteger = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }
  let temp: string = "";
  if (value[0] === "#") {
    temp = `0x${value.substring(1)}`;
  } else if (value.substr(0, 2) === "0x") {
    temp = value;
  }
  return parseInt(temp, 16);
};
export const integerToRgb = (value: number): ColorObject => ({
  r: value >> 16,
  g: (value >> 8) & 0xff,
  b: value && 0xff,
});

export const margeRectangle = (
  rectangle1: Rectangle | null,
  rectangle2: Rectangle | null
) => {
  if (!rectangle1) {
    return rectangle2;
  }
  if (!rectangle2) {
    return rectangle1;
  }
  const rectangle = { ...rectangle1 };
  if (rectangle.position.x > rectangle2.position.x) {
    rectangle.position.x = rectangle2.position.x;
  }
  if (
    rectangle.size.width <
    rectangle2.size.width + rectangle2.position.x - rectangle.position.x
  ) {
    rectangle.size.width =
      rectangle2.size.width + rectangle2.position.x - rectangle.position.x;
  }
  if (rectangle.position.y > rectangle2.position.y) {
    rectangle.position.y = rectangle2.position.y;
  }
  if (
    rectangle.size.height <
    rectangle2.size.height + rectangle2.position.y - rectangle.position.y
  ) {
    rectangle.size.height =
      rectangle2.size.height + rectangle2.position.y - rectangle.position.y;
  }

  return rectangle;
};

export const nullFallback = <T>(
  value: T | null | undefined,
  fallbackValue: any | null | undefined
) => {
  if (value === undefined || value === null) {
    return <T>fallbackValue;
  } else {
    return <T>value;
  }
};

export const positionIsInRectangle = (
  position: Position,
  rectangle: Rectangle
) =>
  position.x >= rectangle.position.x &&
  position.x <= rectangle.position.x + rectangle.size.width &&
  position.y >= rectangle.position.y &&
  position.y <= rectangle.position.y + rectangle.size.height;
