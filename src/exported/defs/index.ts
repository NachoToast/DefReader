import { Def } from '../def.js';
import { RecipeDef } from './recipeDef.js';
import { ResearchProjectDef } from './researchProjectDef.js';

export * from './recipeDef.js';
export * from './researchProjectDef.js';

export interface DefMap {
    recipeDefs: RecipeDef;

    researchProjectDefs: ResearchProjectDef;

    otherDefs: Def;
}
