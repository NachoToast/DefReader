import { ResearchProjectDef, TechLevel } from '../exported/index.js';
import { MapperFor } from '../Mapper.js';
import { getMayRequire } from './utils/getMayRequire.js';

export const researchProjectMapper: MapperFor<ResearchProjectDef> = {
    techLevel: {
        preset: 'string',
        fallback: TechLevel.Undefined,
    },
    requires: {
        get: (node) => node.getListContent('prerequisites'),
        fallback: [],
    },
    hiddenRequires: {
        get: (node) => node.getListContent('hiddenPrerequisites'),
        fallback: [],
    },
    x: {
        get: (node) => node.getNumberValue('researchViewX'),
    },
    y: {
        get: (node) => node.getNumberValue('researchViewY'),
    },
    cost: {
        get: (node) => node.getNumberValue('baseCost'),
    },
    requiredDlc: {
        get: getMayRequire,
    },
};
