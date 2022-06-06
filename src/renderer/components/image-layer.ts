import { isDevelopmentMode, loadImage } from "../common";
import { logger } from "../logging";
import {
  LayerPages, Position,
} from "../models/fsgs-model";
import { Layer, LayerProps } from "./layer";

export interface ImageLayerProps extends LayerProps {
}

export class ImageLayer extends Layer<ImageLayerProps> {
  private m_frameCount: number;
  private m_previousFrameTime: number;

  constructor(props: ImageLayerProps) {
    super(props);
    this.m_frameCount = 0;
    this.m_previousFrameTime = Date.now();
  }

  calculateFps = () => {
    this.m_frameCount++;
    const now = Date.now();
    if (now - this.m_previousFrameTime < 1000) {
      return null;
    }
    const frameRate = (this.m_frameCount * 1000) / (now - this.m_previousFrameTime);
    this.m_previousFrameTime = now;
    this.m_frameCount = 0;
    return Math.round(frameRate);
  };

  showFps = () => {
    if (!this.m_dom) {
      return;
    }
    const context = this.m_dom.getContext("2d");
    if (!context || !this.props.showFrameRate) {
      return;
    }
    const frameRate = this.calculateFps();
    if (!frameRate) {
      return;
    }
    const frameRateText = `${frameRate}`;
    context.textAlign = "left";
    context.textBaseline = "top";
    context.font = "10px";
    const width = context.measureText(frameRateText).width;
    context.fillStyle = "black";
    context.fillRect(0, 0, width, 10);
    context.fillStyle = "lime";
    context.fillText(frameRateText, 0, 0);
  };

  update = async () => {
    if (this.m_dom) {
      const clientWidth = document.body.clientWidth;
      const clientHeight = document.body.clientHeight;
      const ratio = this.props.height / this.props.width;

      if (ratio < clientHeight / clientWidth) {
        this.m_dom.style.height = "";
        this.m_dom.style.width = `${clientWidth}px`;
      } else {
        this.m_dom.style.width = "";
        this.m_dom.style.height = `${clientHeight}px`;
      }
      isDevelopmentMode && this.showFps();
    }
  };

  setImage = async (image: HTMLImageElement, page: LayerPages, position?: Position) => {
    this.m_bufferCanvas.width = this.props.width;
    this.m_bufferCanvas.height = this.props.height;
    const buffer = this.m_bufferCanvas.getContext("2d");
    if (!this.m_dom || !buffer) {
      return;
    }
    buffer.drawImage(image, position?.x || 0, position?.y || 0);
    switch (page) {
      case LayerPages.Back: {
        this.m_backImage = await loadImage(this.m_bufferCanvas.toDataURL());
        break;
      }
      case LayerPages.Fore:
      default: {
        this.m_foreImage = await loadImage(this.m_bufferCanvas.toDataURL());
      }
    }
  };
}

export type ImageLayerCollection = (ImageLayer | null)[];
