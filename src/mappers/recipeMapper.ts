import { DefNameAndCount, RecipeDef } from '../exported/index.js';
import { MapperFor } from '../Mapper.js';

export const recipeMapper: MapperFor<RecipeDef> = {
    ingredients: {
        get: (node) => {
            const subNodes = node.getChild('ingredients')?.getChildren();

            if (subNodes === undefined) {
                return null;
            }

            const output: DefNameAndCount[] = [];

            for (const subNode of subNodes) {
                const filter = subNode.getChild('filter', true);
                const count = subNode.getNumberValue('count', true);

                const thingDefs = filter.getListContent('thingDefs');

                if (thingDefs === null) continue;

                for (const defName of thingDefs) {
                    output.push({ defName, count });
                }
            }

            return output;
        },
        fallback: [],
    },
    products: {
        get: () => null,
        fallback: [],
    },
    buildings: {
        get: (node) => node.getListContent('recipeUsers'),
        fallback: [],
    },
    requires: {
        get: (node) => node.getListContent('researchPrerequisites'),
        fallback: [],
    },
};
