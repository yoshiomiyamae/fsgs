export interface GetImageArgs {
  layer: 'base' | 'graph' | 'message';
  page: LayerPages;
  layerNumber: number;
  left: number;
  top: number;
  filePath: string;
}

export interface GetAudioArgs {
  for: string;
  loop: boolean;
  filePath: string;
}

export interface GetScriptArgs {
  scriptName: string;
  startFrom: string | number;
}

export interface DoRuleTransitionArgs {
  layer: 'base' | 'message';
  layerNumber: number;
  time: number;
  vague: number;
  fileName: string;
}

export enum LayerPages {
  Fore = 'fore',
  Back = 'back',
}