import * as React from "react";
import { isDevelopmentMode } from "../common";
import {
  LayerPages,
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

  setImage = (image: HTMLImageElement, page: LayerPages) => {
    switch (page) {
      case LayerPages.Back: {
        this.m_backImage = image;
        break;
      }
      case LayerPages.Fore:
      default: {
        this.m_foreImage = image;
        if (this.m_dom) {
          const context = this.m_dom.getContext("2d");
          context?.drawImage(image, 0, 0);
        }
        break;
      }
    }
  };
}

export type ImageLayerCollection = (ImageLayer | null)[];
