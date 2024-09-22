import { Def } from './def.js';
import { DefMap } from './defs/index.js';

export * from './def.js';
export * from './defs/index.js';
export * from './enums.js';

export type DefDatabase = {
    [k in keyof DefMap]: Record<Def['defName'], DefMap[k]>;
};

/** Shape of exported data for a single game version. */
export interface ModExport extends DefDatabase {
    /** Number of concrete defs successfully read. */
    concreteDefCount: number;

    /** Number of abstract defs successfully read. */
    abstractDefCount: number;
}
