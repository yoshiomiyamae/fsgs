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
  protected m_dom: HTMLCanvasElement | null;
  protected m_bufferCanvas: HTMLCanvasElement;
  protected m_foreImage: HTMLImageElement | null;
  protected m_backImage: HTMLImageElement | null;
  protected m_transitionWorking: boolean;
  protected m_visible: boolean;
  protected m_left: number;
  protected m_top: number;

  constructor(props: T) {
    super(props);
    this.m_dom = null;
    this.m_bufferCanvas = document.createElement("canvas");
    this.m_foreImage = null;
    this.m_backImage = null;
    this.m_transitionWorking = false;
    this.m_visible = props.visible;
    this.m_left = 0;
    this.m_top = 0;
  }

  set visible (visible: boolean) {
    this.m_visible = visible;
    if (this.m_dom) {
      this.m_dom.style.display = visible ? "inherit" : "none";
    }
  };
  get visible () {
    return this.m_visible;
  };

  get transitionWorking () {
    return this.m_transitionWorking;
  };

  get size () {
    if (this.m_dom) {
      return {
        width: this.m_dom.offsetWidth,
        height: this.m_dom.offsetHeight,
      } as Size;
    } else {
      return null;
    }
  };

  set left (left: number) {
    this.m_left = left;
    if (this.m_dom) {
      this.m_dom.style.left = `${left}px`;
    }
  };

  set top (top: number) {
    this.m_top = top;
    if (this.m_dom) {
      this.m_dom.style.top = `${top}px`;
    }
  };

  set opacity (opacity: number) {
    if (this.m_dom) {
      this.m_dom.style.opacity = `${opacity}`;
    }
  };

  componentDidMount() {
    this.setState({
      visible: this.props.visible,
    });
  }

  universalTransition = async (time: number, setting: TransitionSetting) => {
    if (!this.m_dom) {
      return;
    }
    const context = this.m_dom.getContext("2d");
    this.m_bufferCanvas.width = this.m_dom.width;
    this.m_bufferCanvas.height = this.m_dom.height;
    const buffer = this.m_bufferCanvas.getContext("2d");
    if (
      !buffer ||
      !context ||
      !this.m_backImage ||
      !this.m_foreImage ||
      !setting.rule
    ) {
      return;
    }
    buffer.clearRect(0, 0, this.props.width, this.props.height);
    buffer.drawImage(
      setting.rule,
      0,
      0,
      this.m_backImage.width,
      this.m_backImage.height
    );
    const ruleData = buffer.getImageData(
      0,
      0,
      this.m_backImage.width,
      this.m_backImage.height
    );
    buffer.drawImage(this.m_backImage, 0, 0);
    const backData = buffer.getImageData(
      0,
      0,
      this.m_backImage.width,
      this.m_backImage.height
    );
    buffer.drawImage(this.m_foreImage, 0, 0);
    const foreData = buffer.getImageData(
      0,
      0,
      this.m_foreImage.width,
      this.m_foreImage.height
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
    if (!this.m_dom) {
      return;
    }
    const context = this.m_dom.getContext("2d");
    this.m_bufferCanvas.width = this.m_dom.width;
    this.m_bufferCanvas.height = this.m_dom.height;
    const buffer = this.m_bufferCanvas.getContext("2d");
    if (!buffer || !context || !this.m_backImage || !this.m_foreImage) {
      return;
    }
    const from = setting.from || Direction.Left;
    const stay = setting.stay || StayValue.NoStay;
    switch (from) {
      case Direction.Left:
      case Direction.Right: {
        if (!this.m_backImage || !this.m_foreImage) {
          return;
        }
        for (let x = 0; x <= this.m_backImage.width; x += 5) {
          await sleep(time / this.m_backImage.width);
          switch (stay) {
            case StayValue.StayFore: {
              const x2 =
                from === Direction.Left
                  ? x - this.m_backImage.width
                  : this.m_backImage.width - x;
              buffer.drawImage(this.m_foreImage, 0, 0);
              buffer.drawImage(this.m_backImage, x2, 0);
              break;
            }
            case StayValue.StayBack: {
              const x2 = from === Direction.Left ? -x : x;
              buffer.drawImage(this.m_backImage, 0, 0);
              buffer.drawImage(this.m_foreImage, x2, 0);
              break;
            }
            case StayValue.NoStay: {
              const x2 = from === Direction.Left ? x : -x;
              const x3 =
                from === Direction.Left
                  ? x - this.m_backImage.width
                  : this.m_backImage.width - x;
              buffer.drawImage(this.m_foreImage, x2, 0);
              buffer.drawImage(this.m_backImage, x3, 0);
              break;
            }
          }
          context.putImageData(
            buffer.getImageData(
              0,
              0,
              this.m_bufferCanvas.width,
              this.m_bufferCanvas.height
            ),
            0,
            0
          );
        }
        break;
      }
      case Direction.Top:
      case Direction.Bottom: {
        if (!this.m_backImage || !this.m_foreImage) {
          return;
        }
        for (let y = 0; y <= this.m_backImage.height; y += 5) {
          await sleep(time / this.m_backImage.height);
          switch (stay) {
            case StayValue.StayFore: {
              const y2 =
                from === Direction.Top
                  ? y - this.m_backImage.height
                  : this.m_backImage.height - y;
              buffer.drawImage(this.m_foreImage, 0, 0);
              buffer.drawImage(this.m_backImage, 0, y2);
              break;
            }
            case StayValue.StayBack: {
              const y2 = from === Direction.Top ? -y : y;
              buffer.drawImage(this.m_backImage, 0, 0);
              buffer.drawImage(this.m_foreImage, 0, y2);
              break;
            }
            case StayValue.NoStay: {
              const y2 = from === Direction.Top ? y : -y;
              const y3 =
                from === Direction.Top
                  ? y - this.m_backImage.height
                  : this.m_backImage.height - y;
              buffer.drawImage(this.m_foreImage, 0, y2);
              buffer.drawImage(this.m_backImage, 0, y3);
              break;
            }
          }
          context.putImageData(
            buffer.getImageData(
              0,
              0,
              this.m_bufferCanvas.width,
              this.m_bufferCanvas.height
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
    if (!this.m_dom) {
      return;
    }
    const context = this.m_dom.getContext("2d");
    this.m_bufferCanvas.width = this.m_dom.width;
    this.m_bufferCanvas.height = this.m_dom.height;
    const buffer = this.m_bufferCanvas.getContext("2d");
    if (!buffer || !context || !(this.m_backImage || this.m_foreImage)) {
      return;
    }
    for (let i = 0; i < 0x80; i += 2) {
      await sleep(time / 0x80);
      if (this.m_backImage) {
        buffer.globalAlpha = i / 0x80;
        buffer.drawImage(this.m_backImage, 0, 0);
      }
      if (this.m_foreImage) {
        buffer.globalAlpha = 1 - buffer.globalAlpha;
        buffer.drawImage(this.m_foreImage, 0, 0);
      }
      context.putImageData(
        buffer.getImageData(
          0,
          0,
          this.m_bufferCanvas.width,
          this.m_bufferCanvas.height
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
    this.m_transitionWorking = true;
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
    this.m_foreImage = this.m_backImage;
    this.m_transitionWorking = false;
  };

  backLay = () => {
    if (this.m_foreImage) {
      this.m_backImage = this.m_foreImage.cloneNode(true) as HTMLImageElement;
    }
  };

  copyForeToBack = () => {
    this.m_backImage = this.m_foreImage;
  };

  clear = () => {
    if (!this.m_dom) {
      return;
    }
    const context = this.m_dom.getContext("2d");
    context?.clearRect(0, 0, this.m_dom.width, this.m_dom.height);
  };

  render() {
    if (!this.state) {
      return null;
    }
    return (
      <canvas
        ref={(e) => {
          this.m_dom = e;
        }}
        style={{
          position: "absolute",
          left: this.m_left,
          top: this.m_top,
          display: this.m_visible ? "inherit" : "none",
        }}
        width={this.props.width}
        height={this.props.height}
      />
    );
  }
}