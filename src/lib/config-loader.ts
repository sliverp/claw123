import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { ClawConfig } from './types';

const CLAWS_DIR = path.join(process.cwd(), 'claws');

export function loadAllConfigs(): ClawConfig[] {
  if (!fs.existsSync(CLAWS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(CLAWS_DIR).filter(
    (f) => (f.endsWith('.yaml') || f.endsWith('.yml')) && !f.startsWith('_')
  );
  const configs: ClawConfig[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(CLAWS_DIR, file), 'utf-8');
      const data = yaml.load(content) as ClawConfig;
      if (data && data.slug && data.name) {
        configs.push(data);
      }
    } catch (e) {
      console.error(`Failed to load config ${file}:`, e);
    }
  }

  return configs;
}
