import { promises } from 'fs';
import path from 'path';
import ts, { ModuleKind, ScriptTarget } from 'typescript';
import { Config } from '../renderer/models/fsgs-model';

export const getConfig = async (): Promise<Config> => {
  const data = await promises.readFile(
    path.join(getResourceDirectory(), 'data', 'system', 'config.ts')
  );
  const script = data.toString();
  const transpiledScript = ts.transpile(script, {
    target: ScriptTarget.ES2020,
    module: ModuleKind.CommonJS,
  });
  const config = eval(transpiledScript);
  return config;
};

export const getResourceDirectory = () => {
  return isDevelopmentMode
    ? path.join(process.cwd(), 'build')
    : path.join(process.resourcesPath, 'app.asar', 'build');
};

export const isDevelopmentMode = process.env.NODE_ENV === 'development';
