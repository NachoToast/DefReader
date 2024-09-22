import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { ParsedNode } from './ParsedNode.js';

/** Parses a raw XML string, returning a list of top-level XML nodes. */
function parseFileContents(rawInput: string, fileName: string): ParsedNode[] {
    const rootNodes = new Array<ParsedNode>();

    const nodeStack = new Array<ParsedNode>();

    let lastOpenBracketIdx = -1;
    let lastTextGroup = '';

    for (let i = 0; i < rawInput.length; i++) {
        const char = rawInput.charAt(i);

        if (char === '<') {
            lastOpenBracketIdx = i;
        } else if (char === '>') {
            if (hitsCloseEdgeCases(rawInput, i)) {
                lastTextGroup += '>';
                continue;
            }

            const rawTag = rawInput.slice(lastOpenBracketIdx + 1, i);

            if (rawTag.endsWith('/')) {
                // Self-closing tag.

                const node = createNode(rawTag.slice(0, -1), fileName);

                const parentNode = nodeStack.at(-1);

                if (parentNode !== undefined) {
                    parentNode.addChild(node);
                } else {
                    rootNodes.push(node);
                }
            } else if (rawTag.startsWith('/')) {
                // Normal closing tag.

                const node = nodeStack.pop();

                if (node === undefined) {
                    console.error(
                        `XML node ${rawTag} has no corresponding opening node`,
                    );
                    break;
                }

                if ('/' + node.tagName !== rawTag.trim()) {
                    console.error(
                        `XML node ${node.tagName} has no corresponding closing node (instead got ${rawTag})`,
                    );
                    break;
                }

                node.textContent = lastTextGroup.slice(0, -rawTag.length);

                const parentNode = nodeStack.at(-1);

                if (parentNode !== undefined) {
                    parentNode.addChild(node);
                } else {
                    rootNodes.push(node);
                }
            } else {
                nodeStack.push(createNode(rawTag, fileName));
            }

            lastTextGroup = '';
        } else {
            lastTextGroup += char;
        }
    }

    return rootNodes;
}

function createNode(rawTag: string, fileName: string): ParsedNode {
    const [rawName, ...rawAttributes] = rawTag.trim().split(/\s+/g);

    // Name

    let name: ParsedNode['tagName'];

    if (rawName === undefined) {
        console.warn(`Invalid XML node name: ${rawTag}`);
        name = 'Unknown';
    } else {
        name = rawName;
    }

    // Attributes

    const attributes: ParsedNode['attributes'] = {};

    for (const attribute of rawAttributes) {
        const [key, value] = attribute.split('=');

        if (key === undefined || value === undefined) {
            console.warn(
                `XML node ${name} has invalid attributes: ${attribute}`,
            );
        } else {
            attributes[key] = value.slice(1, -1);
        }
    }

    return new ParsedNode(name, attributes, fileName);
}

function hitsCloseEdgeCases(rawInput: string, i: number): boolean {
    // Should really just use a stack or something to check for weird bracket
    // cases like this, but that's a problem for future me :)

    if (rawInput[i + 1] === '=') {
        // Greater than or equal to (>=)
        return true;
    }

    if (rawInput[i - 1] === '-') {
        // Arrow (->), used in grammar rules.
        return true;
    }

    if (rawInput.slice(i + 1, i + 7) === '1)->(*') {
        // <li>root(priority=1,sitePart==Manhunters,count>1)->(*Threat)[count]
        // manhunting [kindLabel](/Threat) are wandering nearby</li>
        return true;
    }

    return false;
}

/**
 * Reads the contents of an XML file, removing some unnecessary information
 * such as comments.
 */
function getFileContents(rootPath: string, fileName: string): string {
    const filePath = join(rootPath, fileName);

    let fileContents = readFileSync(filePath, { encoding: 'utf-8' });

    // Comment Removal

    let nextCommentIndex = fileContents.indexOf('<!--');

    while (nextCommentIndex !== -1) {
        const commentFinishIndex = fileContents.indexOf('-->');

        fileContents =
            fileContents.slice(0, nextCommentIndex) +
            fileContents.slice(commentFinishIndex + 3);

        nextCommentIndex = fileContents.indexOf('<!--');
    }

    // Top-Level Tag Removal

    const tagsToRemove = [
        '<Defs>',
        '</Defs>',
        '<?xml version="1.0" encoding="utf-8"?>',
        '<?xml version="1.0" encoding="utf-8" ?>',
    ];

    for (const tag of tagsToRemove) {
        const tagIndex = fileContents.indexOf(tag);
        if (tagIndex !== -1) {
            fileContents =
                fileContents.slice(0, tagIndex) +
                fileContents.slice(tagIndex + tag.length + 1);
        }
    }

    return fileContents;
}

export function readAllDefs(rootPath: string): ParsedNode[] {
    const output = new Array<ParsedNode>();

    const allFiles = readdirSync(rootPath, {
        recursive: true,
        encoding: 'utf-8',
    });

    for (const fileName of allFiles) {
        if (!fileName.endsWith('.xml')) continue;

        const fileContents = getFileContents(rootPath, fileName);

        output.push(...parseFileContents(fileContents, fileName));
    }

    return output;
}
