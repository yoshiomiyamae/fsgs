import crypto from 'crypto';
import { ParameterSet } from '../renderer/models/fsgs-model';
import { getConfig, getResourceDirectory } from './config';
import fs from 'fs';
import path from 'path';

const SAVE_DATA_DIR = path.join(process.cwd(), "build", 'savedata');
const getSaveFilePath = (n: number) => path.join(SAVE_DATA_DIR, `${n}`);

export const save = async (n: number, params: ParameterSet, f: {}) => {
  const config = await getConfig();
  if (!config.windowConfig?.saveDataKey || !config.windowConfig?.saveDataIv){
    return;
  }
  const key = Buffer.from(config.windowConfig.saveDataKey, 'hex');
  const iv = Buffer.from(config.windowConfig.saveDataIv, 'hex');
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const saveData = JSON.stringify({params, f});
  const cryptedSaveData1 = cipher.update(saveData, 'utf8')
  const cryptedSaveData2 = cipher.final();

  if(!fs.existsSync(SAVE_DATA_DIR)) {
    fs.mkdirSync(SAVE_DATA_DIR);
  }
  const saveFilePath = getSaveFilePath(n);
  fs.writeFileSync(saveFilePath, cryptedSaveData1);
  fs.appendFileSync(saveFilePath, cryptedSaveData2);
}

export const load = async (n: number): Promise<{params: ParameterSet, f: {}}> => {
  const config = await getConfig();
  if (!config.windowConfig?.saveDataKey || !config.windowConfig?.saveDataIv){
    return {params: {}, f: {}};
  }

  const saveFilePath = getSaveFilePath(n);
  const cryptedSaveData = fs.readFileSync(saveFilePath);

  const key = Buffer.from(config.windowConfig.saveDataKey, 'hex');
  const iv = Buffer.from(config.windowConfig.saveDataIv, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const saveData = decipher.update(cryptedSaveData).toString() + decipher.final('utf8').toString();
  const {params, f} = JSON.parse(saveData);
  return {params, f};
}