import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ParameterSet } from '../renderer/models/fsgs-model';
import { getConfig } from './config';

const SAVE_DATA_DIR = path.join(process.cwd(), 'savedata');
const getSaveFilePath = (n: number) => path.join(SAVE_DATA_DIR, `${n}`);

const getKeyIv = async () => {
  const config = await getConfig();
  if (!config.windowConfig?.saveDataKey || !config.windowConfig?.saveDataIv) {
    return { key: '', iv: '' };
  }
  const key = Buffer.from(config.windowConfig.saveDataKey, 'hex');
  const iv = Buffer.from(config.windowConfig.saveDataIv, 'hex');
  return { key, iv };
};
export const save = async (n: number, params: ParameterSet, f: {}) => {
  const { key, iv } = await getKeyIv();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const saveData = JSON.stringify({ params, f });
  const cryptedSaveData1 = cipher.update(saveData, 'utf8');
  const cryptedSaveData2 = cipher.final();

  if (!fs.existsSync(SAVE_DATA_DIR)) {
    fs.mkdirSync(SAVE_DATA_DIR);
  }
  const saveFilePath = getSaveFilePath(n);
  fs.writeFileSync(saveFilePath, cryptedSaveData1);
  fs.appendFileSync(saveFilePath, cryptedSaveData2);
};

export const load = async (
  n: number
): Promise<{ params: ParameterSet; f: {} }> => {
  const saveFilePath = getSaveFilePath(n);
  const cryptedSaveData = fs.readFileSync(saveFilePath);

  const { key, iv } = await getKeyIv();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const saveData =
    decipher.update(cryptedSaveData).toString() +
    decipher.final('utf8').toString();
  const { params, f } = JSON.parse(saveData);
  return { params, f };
};

export const getSaves = async () => {
  const { key, iv } = await getKeyIv();

  if (!fs.existsSync(SAVE_DATA_DIR)) {
    fs.mkdirSync(SAVE_DATA_DIR);
  }

  const saveFiles = fs.readdirSync(SAVE_DATA_DIR);
  if (!saveFiles) {
    return [];
  }
  const saves = saveFiles.map((saveFilePath) => {
    const cryptedSaveData = fs.readFileSync(
      path.join(SAVE_DATA_DIR, saveFilePath)
    );
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const saveData =
      decipher.update(cryptedSaveData).toString() +
      decipher.final('utf8').toString();
    const { params, f } = JSON.parse(saveData) as {
      params: ParameterSet;
      f: {};
    };
    return { params, f };
  });

  return saves;
};
