import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { WorldSnapshot } from '@bloxcraft/shared';

export class SaveStore {
  constructor(private readonly filePath: string) {
    mkdirSync(dirname(filePath), { recursive: true });
  }

  load(): WorldSnapshot | null {
    try {
      return JSON.parse(readFileSync(this.filePath, 'utf-8')) as WorldSnapshot;
    } catch {
      return null;
    }
  }

  save(snapshot: WorldSnapshot): void {
    writeFileSync(this.filePath, JSON.stringify(snapshot));
  }
}
