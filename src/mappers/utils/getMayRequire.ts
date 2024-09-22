import { DLC } from '../../exported/enums.js';
import { ParsedNode } from '../../ParsedNode.js';

export function getMayRequire(node: ParsedNode): DLC[] {
    const mayRequireAttribute = node.getAttribute('MayRequire');

    if (mayRequireAttribute === null) {
        return [];
    }

    const rawNames = mayRequireAttribute
        .split(',')
        .map((e) => e.trim().replace('Ludeon.RimWorld.', ''));

    const output: DLC[] = [];

    for (const name of rawNames) {
        const dlc = DLC[name as DLC] as DLC | undefined;

        if (dlc !== undefined) {
            output.push(dlc);
        } else {
            console.warn(
                `Unrecognised DLC in MayRequire for ${node.toStringShort()}: ${name}`,
            );
        }
    }

    return output;
}
