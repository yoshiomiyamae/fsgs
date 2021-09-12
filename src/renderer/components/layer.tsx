import React from "react";
import { sleep } from "../common";
import { Direction, Size, StayValue, TransitionSetting } from "../models/fsgs-model";

export interface LayerProps {
  visible: boolean;
  width: number;
  height: number;
  showFrameRate?: boolean;
}

export abstract class Layer<T extends LayerProps> extends React.Component<T> {
  protected dom: HTMLCanvasElement | null;
  protected bufferCanvas: HTMLCanvasElement;
  protected foreImage: HTMLImageElement | null;
  protected backImage: HTMLImageElement | null;
  protected transitionWorking: boolean;
  protected visible: boolean;
  protected left: number;
  protected top: number;

  constructor(props: T) {
    super(props);
    this.dom = null;
    this.bufferCanvas = document.createElement("canvas");
    this.foreImage = null;
    this.backImage = null;
    this.transitionWorking = false;
    this.visible = props.visible;
    this.left = 0;
    this.top = 0;
  }

  componentDidMount() {
    this.setState({
      visible: this.props.visible,
    });
  }

  universalTransition = async (time: number, setting: TransitionSetting) => {
    if (!this.dom) {
      return;
    }
    const context = this.dom.getContext("2d");
    this.bufferCanvas.width = this.dom.width;
    this.bufferCanvas.height = this.dom.height;
    const buffer = this.bufferCanvas.getContext("2d");
    if (
      !buffer ||
      !context ||
      !this.backImage ||
      !this.foreImage ||
      !setting.rule
    ) {
      return;
    }
    buffer.clearRect(0, 0, this.props.width, this.props.height);
    buffer.drawImage(
      setting.rule,
      0,
      0,
      this.backImage.width,
      this.backImage.height
    );
    const ruleData = buffer.getImageData(
      0,
      0,
      this.backImage.width,
      this.backImage.height
    );
    buffer.drawImage(this.backImage, 0, 0);
    const backData = buffer.getImageData(
      0,
      0,
      this.backImage.width,
      this.backImage.height
    );
    buffer.drawImage(this.foreImage, 0, 0);
    const foreData = buffer.getImageData(
      0,
      0,
      this.foreImage.width,
      this.foreImage.height
    );
    const vague = setting.vague || 5;
    for (let i = -vague; i < 0x100; i += 5) {
      await sleep(time / 0x100);
      for (let j = 0; j < foreData.data.length; j += 4) {
        if (ruleData.data[j] < i) {
          foreData.data[j] = backData.data[j];
          foreData.data[j + 1] = backData.data[j + 1];
          foreData.data[j + 2] = backData.data[j + 2];
        } else if (ruleData.data[j] - i < vague) {
          const alpha = (ruleData.data[j] - i) / vague;
          foreData.data[j] =
            (((backData.data[j] * (1 - alpha)) & 0xff) +
              ((foreData.data[j] * alpha) & 0xff)) &
            0xff;
          foreData.data[j + 1] =
            (((backData.data[j + 1] * (1 - alpha)) & 0xff) +
              ((foreData.data[j + 1] * alpha) & 0xff)) &
            0xff;
          foreData.data[j + 2] =
            (((backData.data[j + 2] * (1 - alpha)) & 0xff) +
              ((foreData.data[j + 2] * alpha) & 0xff)) &
            0xff;
        }
      }
      context.putImageData(foreData, 0, 0);
    }
  };

  scrollTransition = async (time: number, setting: TransitionSetting) => {
    if (!this.dom) {
      return;
    }
    const context = this.dom.getContext("2d");
    this.bufferCanvas.width = this.dom.width;
    this.bufferCanvas.height = this.dom.height;
    const buffer = this.bufferCanvas.getContext("2d");
    if (!buffer || !context || !this.backImage || !this.foreImage) {
      return;
    }
    const from = setting.from || Direction.Left;
    const stay = setting.stay || StayValue.NoStay;
    switch (from) {
      case Direction.Left:
      case Direction.Right: {
        if (!this.backImage || !this.foreImage) {
          return;
        }
        for (let x = 0; x <= this.backImage.width; x += 5) {
          await sleep(time / this.backImage.width);
          switch (stay) {
            case StayValue.StayFore: {
              const x2 =
                from === Direction.Left
                  ? x - this.backImage.width
                  : this.backImage.width - x;
              buffer.drawImage(this.foreImage, 0, 0);
              buffer.drawImage(this.backImage, x2, 0);
              break;
            }
            case StayValue.StayBack: {
              const x2 = from === Direction.Left ? -x : x;
              buffer.drawImage(this.backImage, 0, 0);
              buffer.drawImage(this.foreImage, x2, 0);
              break;
            }
            case StayValue.NoStay: {
              const x2 = from === Direction.Left ? x : -x;
              const x3 =
                from === Direction.Left
                  ? x - this.backImage.width
                  : this.backImage.width - x;
              buffer.drawImage(this.foreImage, x2, 0);
              buffer.drawImage(this.backImage, x3, 0);
              break;
            }
          }
          context.putImageData(
            buffer.getImageData(
              0,
              0,
              this.bufferCanvas.width,
              this.bufferCanvas.height
            ),
            0,
            0
          );
        }
        break;
      }
      case Direction.Top:
      case Direction.Bottom: {
        if (!this.backImage || !this.foreImage) {
          return;
        }
        for (let y = 0; y <= this.backImage.height; y += 5) {
          await sleep(time / this.backImage.height);
          switch (stay) {
            case StayValue.StayFore: {
              const y2 =
                from === Direction.Top
                  ? y - this.backImage.height
                  : this.backImage.height - y;
              buffer.drawImage(this.foreImage, 0, 0);
              buffer.drawImage(this.backImage, 0, y2);
              break;
            }
            case StayValue.StayBack: {
              const y2 = from === Direction.Top ? -y : y;
              buffer.drawImage(this.backImage, 0, 0);
              buffer.drawImage(this.foreImage, 0, y2);
              break;
            }
            case StayValue.NoStay: {
              const y2 = from === Direction.Top ? y : -y;
              const y3 =
                from === Direction.Top
                  ? y - this.backImage.height
                  : this.backImage.height - y;
              buffer.drawImage(this.foreImage, 0, y2);
              buffer.drawImage(this.backImage, 0, y3);
              break;
            }
          }
          context.putImageData(
            buffer.getImageData(
              0,
              0,
              this.bufferCanvas.width,
              this.bufferCanvas.height
            ),
            0,
            0
          );
        }
        break;
      }
    }
  };

  crossFadeTransition = async (time: number) => {
    if (!this.dom) {
      return;
    }
    const context = this.dom.getContext("2d");
    this.bufferCanvas.width = this.dom.width;
    this.bufferCanvas.height = this.dom.height;
    const buffer = this.bufferCanvas.getContext("2d");
    if (!buffer || !context || !(this.backImage || this.foreImage)) {
      return;
    }
    for (let i = 0; i < 0x80; i += 2) {
      await sleep(time / 0x80);
      if (this.backImage) {
        buffer.globalAlpha = i / 0x80;
        buffer.drawImage(this.backImage, 0, 0);
      }
      if (this.foreImage) {
        buffer.globalAlpha = 1 - buffer.globalAlpha;
        buffer.drawImage(this.foreImage, 0, 0);
      }
      context.putImageData(
        buffer.getImageData(
          0,
          0,
          this.bufferCanvas.width,
          this.bufferCanvas.height
        ),
        0,
        0
      );
    }
  };

  transition = async (
    method: string,
    time: number,
    setting: TransitionSetting
  ) => {
    this.transitionWorking = true;
    switch (method) {
      case "universal": {
        await this.universalTransition(time, setting);
        break;
      }
      case "scroll": {
        await this.scrollTransition(time, setting);
        break;
      }
      case "crossfade": {
        await this.crossFadeTransition(time);
        break;
      }
    }
    this.foreImage = this.backImage;
    this.transitionWorking = false;
  };

  setVisible = (visible: boolean) => {
    this.visible = visible;
    if (this.dom) {
      this.dom.style.display = visible ? "inherit" : "none";
    }
  };
  
  getVisible = () => {
    return this.visible;
  };

  getTransitionWorking = () => {
    return this.transitionWorking;
  };

  getSize = () => {
    if (this.dom) {
      return {
        width: this.dom.offsetWidth,
        height: this.dom.offsetHeight,
      } as Size;
    } else {
      return null;
    }
  };

  setLeft = (left: number) => {
    this.left = left;
    if (this.dom) {
      this.dom.style.left = `${left}px`;
    }
  };

  setTop = (top: number) => {
    this.top = top;
    if (this.dom) {
      this.dom.style.top = `${top}px`;
    }
  };

  backLay = () => {
    if (this.foreImage) {
      this.backImage = this.foreImage.cloneNode(true) as HTMLImageElement;
    }
  };

  setOpacity = (opacity: number) => {
    if (this.dom) {
      this.dom.style.opacity = `${opacity}`;
    }
  };

  copyForeToBack = () => {
    this.backImage = this.foreImage;
  };

  clear = () => {
    if (!this.dom) {
      return;
    }
    const context = this.dom.getContext("2d");
    context?.clearRect(0, 0, this.dom.width, this.dom.height);
  };

  render() {
    if (!this.state) {
      return null;
    }
    return (
      <canvas
        ref={(e) => {
          this.dom = e;
        }}
        style={{
          position: "absolute",
          left: this.left,
          top: this.top,
          display: this.visible ? "inherit" : "none",
        }}
        width={this.props.width}
        height={this.props.height}
      />
    );
  }
}