import { isDevelopmentMode } from "./common";

const logLevel = isDevelopmentMode ? 'debug' : 'error';
const LOG_LEVEL_MAP = {
  'all': 0,
  'trace': 1,
  'debug': 2,
  'info': 3,
  'warn': 4,
  'error': 4,
  'fatal': 5,
  'mark': 6,
  'off': 7,
};

export namespace logger {
  export const trace = (message: any, ...args: any[]) => {
    window.api.logger.trace(message, ...args);
    if (LOG_LEVEL_MAP[logLevel] <= LOG_LEVEL_MAP['trace']){
      console.log(message, ...args);
    }
  }
  export const debug = (message: any, ...args: any[]) => {
    window.api.logger.debug(message, ...args);
    if (LOG_LEVEL_MAP[logLevel] <= LOG_LEVEL_MAP['debug']){
      console.log(message, ...args);
    }
  }
  export const info = (message: any, ...args: any[]) => {
    window.api.logger.info(message, ...args);
    if (LOG_LEVEL_MAP[logLevel] <= LOG_LEVEL_MAP['info']){
      console.log(message, ...args);
    }
  }
  export const warn = (message: any, ...args: any[]) => {
    window.api.logger.warn(message, ...args);
    if (LOG_LEVEL_MAP[logLevel] <= LOG_LEVEL_MAP['warn']){
      console.log(message, ...args);
    }
  }
  export const error = (message: any, ...args: any[]) => {
    window.api.logger.error(message, ...args);
    if (LOG_LEVEL_MAP[logLevel] <= LOG_LEVEL_MAP['error']){
      console.log(message, ...args);
    }
  }
  export const fatal = (message: any, ...args: any[]) => {
    window.api.logger.fatal(message, ...args);
    if (LOG_LEVEL_MAP[logLevel] <= LOG_LEVEL_MAP['fatal']){
      console.log(message, ...args);
    }
  }
  export const mark = (message: any, ...args: any[]) => {
    window.api.logger.mark(message, ...args);
    if (LOG_LEVEL_MAP[logLevel] <= LOG_LEVEL_MAP['mark']){
      console.log(message, ...args);
    }
  }
}