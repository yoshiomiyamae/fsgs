import * as React from "react";
import {
  LayerPages,
} from "../models/fsgs-model";
import { Layer, LayerProps } from "./layer";

export interface ImageLayerProps extends LayerProps {
}

export class ImageLayer extends Layer<ImageLayerProps> {
  private frameCount: number;
  private previousFrameTime: number;

  constructor(props: ImageLayerProps) {
    super(props);
    this.frameCount = 0;
    this.previousFrameTime = Date.now();
  }

  calculateFps = () => {
    this.frameCount++;
    const now = Date.now();
    if (now - this.previousFrameTime < 1000) {
      return null;
    }
    const frameRate = (this.frameCount * 1000) / (now - this.previousFrameTime);
    this.previousFrameTime = now;
    this.frameCount = 0;
    return Math.round(frameRate);
  };

  showFps = () => {
    if (!this.dom) {
      return;
    }
    const context = this.dom.getContext("2d");
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
    if (this.dom) {
      const clientWidth = document.body.clientWidth;
      const clientHeight = document.body.clientHeight;
      const ratio = this.props.height / this.props.width;

      if (ratio < clientHeight / clientWidth) {
        this.dom.style.height = "";
        this.dom.style.width = `${clientWidth}px`;
      } else {
        this.dom.style.width = "";
        this.dom.style.height = `${clientHeight}px`;
      }
      process.env.NODE_ENV === 'development' && this.showFps();
    }
  };

  setImage = (image: HTMLImageElement, page: LayerPages) => {
    switch (page) {
      case LayerPages.Back: {
        this.backImage = image;
        break;
      }
      case LayerPages.Fore:
      default: {
        this.foreImage = image;
        if (this.dom) {
          const context = this.dom.getContext("2d");
          context?.drawImage(image, 0, 0);
        }
        break;
      }
    }
  };
}

export type ImageLayerCollection = (ImageLayer | null)[];
