import { Def } from '../def.js';
import { DLC, TechLevel } from '../enums.js';

export interface ResearchProjectDef extends Def {
    techLevel: TechLevel;

    requires: ResearchProjectDef['defName'][];

    hiddenRequires: ResearchProjectDef['defName'][];

    x: number;

    y: number;

    cost: number;

    requiredDlc: DLC[];
}
