import { Def, DefMap } from './exported/index.js';
import { recipeMapper } from './mappers/recipeMapper.js';
import { researchProjectMapper } from './mappers/researchProjectMapper.js';
import { ParsedNode } from './ParsedNode.js';

type AllowedType = string | number | boolean | AllowedType[];

interface PropertyHandler<T> {
    get: (node: ParsedNode) => T | null;

    inherit?: (parent: T | null, child: T | null) => T | null;

    fallback?: T;

    preset?: never;
}

type WithOptionalPreset<T> = T extends string
    ? { preset: 'string'; fallback?: T } | PropertyHandler<T>
    : T extends number
      ? { preset: 'number'; fallback?: T } | PropertyHandler<T>
      : T extends boolean
        ? { preset: 'boolean'; fallback?: T } | PropertyHandler<T>
        : PropertyHandler<T>;

export type MapperFor<T> = {
    [k in keyof Omit<
        T,
        'defName' | 'label' | 'description'
    >]: WithOptionalPreset<T[k]>;
};

interface LocalDatabaseInfo<T extends Def> {
    concrete: Record<T['defName'], T>;

    named: Record<string, Partial<T>>;

    abstractCount: number;
}

type LocalDefDatabase = { [k in keyof DefMap]: LocalDatabaseInfo<DefMap[k]> };

export class Mapper {
    private readonly defDatabase: LocalDefDatabase = {
        recipeDefs: {
            concrete: {},
            named: {},
            abstractCount: 0,
        },
        researchProjectDefs: {
            concrete: {},
            named: {},
            abstractCount: 0,
        },
        otherDefs: {
            concrete: {},
            named: {},
            abstractCount: 0,
        },
    };

    private readonly allNames: Set<string>;

    private readonly untriedNodes: ParsedNode[];

    private readonly failedNodes: ParsedNode[];

    public constructor(rootNodes: ParsedNode[]) {
        this.allNames = new Set();
        this.untriedNodes = rootNodes;
        this.failedNodes = [];

        // Setup all names

        for (const node of rootNodes) {
            const name = node.getAttribute('Name');
            if (name !== null) {
                this.allNames.add(name);
            }
        }
    }

    private static handleProperty(
        handler: WithOptionalPreset<AllowedType>,
        node: ParsedNode,
        key: string,
        parent?: Record<string, AllowedType>,
    ): AllowedType | null {
        let value: AllowedType | null | undefined;

        switch (handler.preset) {
            case 'string':
                value =
                    node.getStringValue(key) ??
                    parent?.[key] ??
                    handler.fallback;
                break;
            case 'boolean':
                value =
                    node.getBooleanValue(key) ??
                    parent?.[key] ??
                    handler.fallback;
                break;
            case 'number':
                value =
                    node.getNumberValue(key) ??
                    parent?.[key] ??
                    handler.fallback;
                break;
            default:
                {
                    value = handler.get(node);

                    const parentVal = parent?.[key];

                    if (parentVal !== undefined) {
                        if (handler.inherit !== undefined) {
                            value = handler.inherit(
                                parentVal as unknown as null,
                                value as null,
                            );
                        } else if (Array.isArray(parentVal)) {
                            value = Array.isArray(value)
                                ? [...parentVal, ...value]
                                : [...parentVal];
                        } else {
                            value ??= parentVal;
                        }
                    }

                    if (value === null && handler.fallback) {
                        value = handler.fallback;
                    }
                }
                break;
        }

        if (
            (value === undefined || value === null) &&
            node.getAttribute('Abstract') !== 'True'
        ) {
            throw new Error(
                `${node.toStringShort()} is missing required property ${key} (preset=${handler.preset?.toString() ?? 'none'})`,
            );
        }

        return value ?? null;
    }

    public mapAll(round = 1): LocalDefDatabase {
        for (let i = this.untriedNodes.length - 1; i >= 0; i--) {
            const node = this.untriedNodes[i];

            if (node === undefined) continue;

            if (this.tryMapDef(node)) {
                this.untriedNodes.splice(i, 1);
            }
        }

        if (round > 10) {
            throw new Error(`Took too many rounds to try resolve all defs!`);
        }

        if (this.untriedNodes.length > 0) {
            return this.mapAll(round + 1);
        }

        return this.defDatabase;
    }

    private mapDef<T extends Def>(
        node: ParsedNode,
        mapper: MapperFor<T>,
        localDb: LocalDatabaseInfo<T>,
    ): boolean {
        const nameAttr = node.getAttribute('Name');
        const parentNameAttr = node.getAttribute('ParentName');
        const isAbstract = node.getAttribute('Abstract') === 'True';

        // Inheritance Prechecks

        let parent: Partial<T> | undefined = undefined;

        if (parentNameAttr !== null) {
            parent = localDb.named[parentNameAttr];

            if (parent === undefined) {
                // Might not have encountered parent yet, so skip for now.
                if (this.allNames.has(parentNameAttr)) {
                    // We will eventually encounter the parent.
                    return false;
                }

                throw new Error(
                    `${node.toStringShort()} has unresolvable parent (${parentNameAttr})`,
                );
            }
        }

        const def: Partial<T> = {};

        // Base Properties

        for (const key of ['defName', 'label', 'description'] as const) {
            const value = node.getStringValue(key) ?? parent?.[key];

            if (value !== undefined) {
                def[key] = value;
            }
        }

        // Other Properties

        for (const key of Object.keys(mapper) as (keyof MapperFor<T>)[]) {
            const handler = mapper[key];

            const value = Mapper.handleProperty(
                handler as WithOptionalPreset<AllowedType>,
                node,
                key.toString(),
                parent as Record<string, AllowedType> | undefined,
            ) as T[keyof T];

            if (value !== undefined && value !== null) {
                def[key as keyof T] = value;
            }
        }

        // Database Modification

        if (isAbstract) {
            localDb.abstractCount++;
        } else {
            if (!def.defName) {
                throw new Error(`${node.toStringShort()} is missing a defName`);
            }

            localDb.concrete[def.defName] = def as T;
        }

        if (nameAttr !== null) {
            localDb.named[nameAttr] = def;
        }

        return true;
    }

    private tryMapDef(node: ParsedNode): boolean {
        try {
            switch (node.tagName) {
                case 'ResearchProjectDef':
                    return this.mapDef(
                        node,
                        researchProjectMapper,
                        this.defDatabase.researchProjectDefs,
                    );
                case 'RecipeDef':
                    return this.mapDef(
                        node,
                        recipeMapper,
                        this.defDatabase.recipeDefs,
                    );
                default:
                    // console.warn(`No mapper defined for ${node.tagName}`);
                    return true;
            }
        } catch (error) {
            console.log(`Failed to map ${node.toStringShort()}`, error);
            this.failedNodes.push(node);

            const name = node.getAttribute('Name');
            if (name !== null) {
                this.allNames.delete(name);
            }

            return true;
        }
    }
}
