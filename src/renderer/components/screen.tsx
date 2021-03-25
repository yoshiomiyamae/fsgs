import * as React from 'react';
import {sleep} from '../common';
import { LayerPages, Direction, StayValue, TransitionSetting } from '../models/fsgs-model';

export interface ScreenProps {
  visible: boolean;
  width: number;
  height: number;
  showFrameRate?: boolean;
}

export class Screen extends React.Component<ScreenProps> {
  private dom: HTMLCanvasElement | null;
  
  private name: string;
  private backImage: HTMLImageElement | null;
  private foreImage: HTMLImageElement | null;
  private visible: boolean;
  private left: number;
  private top: number;
  private opacity: number;
  private autohide: boolean;
  private index: number;

  private transitionWorking: boolean;

  constructor (props: ScreenProps) {
    super(props);

    this.dom = null;
    
    this.name = '';
    this.backImage = null;
    this.foreImage = null;
    this.visible = false;
    this.left = 0;
    this.top = 0;
    this.opacity = 0xFF;
    this.autohide = false;
    this.index = 0;
    
    this.transitionWorking = false;
  }
  
  update = async () => {
    if (this.dom) {
      const clientWidth = document.body.clientWidth;
      const clientHeight = document.body.clientHeight;
      const ratio = this.props.height / this.props.width;
      
      if (ratio < clientHeight / clientWidth) {
        this.dom.style.height = '';
        this.dom.style.width = `${clientWidth}px`;
      } else {
        this.dom.style.width = '';
        this.dom.style.height = `${clientHeight}px`;
      }
    }
  }

  render () {
    if (this.state) {
      return <canvas
        ref={e => {this.dom = e}}
        style={{position: 'absolute', left: 0, top: 0}}
        width={this.props.width}
        height={this.props.height}
        />;
    } else {
      return null;
    }
  }

  setImage = (image: HTMLImageElement, page: LayerPages) => {
    switch(page){
      case LayerPages.Back: {
        this.backImage = image;
        break;
      }
      case LayerPages.Fore:
      default: {
        this.foreImage = image;
        break;
      }
    }
  }

  setLeft = (left: number) => {
    this.left = left;
  }

  setTop = (top: number) => {
    this.top = top;
  }

  backLay = () => {
    if (this.foreImage) {
      this.backImage = this.foreImage.cloneNode(true) as HTMLImageElement;
    }
  }

  setOpacity = (opacity: number) => {
    this.opacity = opacity;
  }

  copyForeToBack = () => {
    this.backImage = this.foreImage;
  }

  

  transition = async (method: string, time: number, setting: TransitionSetting) => {
    this.transitionWorking = true;
    if (this.dom) {
      const context = this.dom.getContext('2d');
      const bufferCanvas = document.createElement('canvas');
      bufferCanvas.width = this.dom.width;
      bufferCanvas.height = this.dom.height;
      const buffer = bufferCanvas.getContext('2d');
      if (context && buffer) {
        buffer.clearRect(0, 0, this.props.width, this.props.height);
        switch(method) {
          case 'universal': {
            if (this.backImage && this.foreImage && setting.rule) {
              buffer.drawImage(setting.rule, 0, 0, this.backImage.width, this.backImage.height);
              const ruleData = buffer.getImageData(0, 0, this.backImage.width, this.backImage.height);
              buffer.drawImage(this.backImage, 0, 0);
              const backData = buffer.getImageData(0, 0, this.backImage.width, this.backImage.height);
              buffer.drawImage(this.foreImage, 0, 0);
              const foreData = buffer.getImageData(0, 0, this.foreImage.width, this.foreImage.height);
              const vague = setting.vague || 5;
              for(let i = 0; i < 0x100; i++) {
                await sleep(time / 0x100);
                for (let j = 0; j < foreData.data.length; j += 4) {
                  if (ruleData.data[j] < i) {
                    foreData.data[j] = backData.data[j];
                    foreData.data[j + 1] = backData.data[j + 1];
                    foreData.data[j + 2] = backData.data[j + 2];
                  } else if (ruleData.data[j] - i < vague) {
                    const alpha = (ruleData.data[j] - i) / vague;
                    foreData.data[j] = (((backData.data[j] * (1 - alpha)) & 0xFF) + ((foreData.data[j] * alpha) & 0xFF)) & 0xFF;
                    foreData.data[j + 1] = (((backData.data[j + 1] * (1 - alpha)) & 0xFF) + ((foreData.data[j + 1] * alpha) & 0xFF)) & 0xFF;
                    foreData.data[j + 2] = (((backData.data[j + 2] * (1 - alpha)) & 0xFF) + ((foreData.data[j + 2] * alpha) & 0xFF)) & 0xFF;
                  }
                }
                context.putImageData(foreData, 0, 0);
              }
            }
            break;
          }
          case 'scroll': {
            const from = setting.from || Direction.Left;
            const stay = setting.stay || StayValue.NoStay;
            switch(from) {
              case Direction.Left:
              case Direction.Right: {
                if (this.backImage && this.foreImage) {
                  for (let x = 0; x <= this.backImage.width; x++) {
                    await sleep(time / this.backImage.width);
                    switch(stay) {
                      case StayValue.StayFore: {
                        const x2 = from === Direction.Left ? x - this.backImage.width : this.backImage.width - x;
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
                        const x3 = from === Direction.Left ? x - this.backImage.width : this.backImage.width - x;
                        buffer.drawImage(this.foreImage, x2, 0);
                        buffer.drawImage(this.backImage, x3, 0);
                        break;
                      }
                    }
                    context.putImageData(buffer.getImageData(0, 0, bufferCanvas.width, bufferCanvas.height), 0, 0);
                  }
                }
                break;
              }
              case Direction.Top:
              case Direction.Bottom: {
                if (this.backImage && this.foreImage) {
                  for (let y = 0; y <= this.backImage.height; y++) {
                    await sleep(time / this.backImage.height);
                    switch(stay) {
                      case StayValue.StayFore: {
                        const y2 = from === Direction.Top ? y - this.backImage.height : this.backImage.height - y;
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
                        const y3 = from === Direction.Top ? y - this.backImage.height : this.backImage.height - y;
                        buffer.drawImage(this.foreImage, 0, y2);
                        buffer.drawImage(this.backImage, 0, y3);
                        break;
                      }
                    }
                    context.putImageData(buffer.getImageData(0, 0, bufferCanvas.width, bufferCanvas.height), 0, 0);
                  }
                }
                break;
              }
            }
            break;
          }
          case 'crossfade': {
            for(let i = 0x20; i < 0x80; i++) {
              await sleep(time / 0x80);
              if (this.backImage) {
                buffer.globalAlpha = i / 0x80;
                buffer.drawImage(this.backImage, 0, 0);
              }
              if (this.foreImage) {
                buffer.globalAlpha = 1 - buffer.globalAlpha;
                buffer.drawImage(this.foreImage, 0, 0);
              }
              context.putImageData(buffer.getImageData(0, 0, bufferCanvas.width, bufferCanvas.height), 0, 0);
            }
            break;
          }
        }
        this.foreImage = this.backImage;
      }
    }
    this.transitionWorking = false;
  }
}
