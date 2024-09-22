import { Def, DefNameAndCount } from '../def.js';
import { ResearchProjectDef } from './researchProjectDef.js';

export interface RecipeDef extends Def {
    ingredients: DefNameAndCount[];

    products: DefNameAndCount[];

    buildings: Def['defName'][];

    requires: ResearchProjectDef['defName'][];
}
