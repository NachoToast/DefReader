export class ParsedNode {
    /**
     * The name of the XML tag this node was parsed from.
     *
     * E.g. `<example>...</example>` would have a tagName of "example".
     */
    public readonly tagName: string;

    /**
     * XML attributes that were parsed alongside the XML tag of this node.
     *
     * E.g. `<example Hello="World" Nacho="Toast">` would have attibutes:
     * ```ts
     * {
     *    "Hello": "World",
     *    "Nacho": "Toast",
     * }
     * ```
     */
    public readonly attributes: Record<string, string>;

    public readonly fileName: string;

    public textContent: string;

    private readonly children: Record<ParsedNode['tagName'], ParsedNode[]>;

    private parent?: ParsedNode;

    public constructor(
        tagName: string,
        attributes: Record<string, string>,
        fileName: string,
    ) {
        this.tagName = tagName;
        this.attributes = attributes;
        this.fileName = fileName;
        this.textContent = '';
        this.children = {};

        // Should really just use a stack or something to check for weird bracket
        // cases like this, but that's a problem for future me :)

        const openBracketIdx = this.tagName.indexOf('<');
        const closeBracketIdx = this.tagName.indexOf('>');

        if (openBracketIdx !== -1) {
            this.tagName = this.tagName.slice(0, openBracketIdx);
        }

        if (closeBracketIdx !== -1) {
            this.tagName = this.tagName.slice(0, closeBracketIdx);
        }
    }

    public addChild(child: ParsedNode): void {
        const childArr = this.children[child.tagName];

        if (childArr !== undefined) {
            childArr.push(child);
        } else {
            this.children[child.tagName] = [child];
        }

        child.parent = this;
    }

    public getAttribute(name: string, required: true): string;
    public getAttribute(name: string, required?: false): string | null;
    public getAttribute(name: string, required = false): string | null {
        const value = this.attributes[name];

        if (value === undefined) {
            if (required) {
                throw new Error(
                    `${this.toStringShort()} attribute cannot be undefined (${
                        this.fileName
                    })`,
                );
            }

            return null;
        }

        return value;
    }

    public getStringValue(name: string, required: true): string;
    public getStringValue(name: string, required?: false): string | null;
    public getStringValue(name: string, required = false): string | null {
        const value = this.children[name]?.at(0)?.textContent;

        if (value === undefined) {
            if (required) {
                throw new Error(
                    `${this.toStringShort()} cannot be undefined (${
                        this.fileName
                    })`,
                );
            }

            return null;
        }

        return value;
    }

    public getNumberValue(name: string, required: true): number;
    public getNumberValue(name: string, required?: false): number | null;
    public getNumberValue(name: string, required = false): number | null {
        const rawValue = this.children[name]?.at(0)?.textContent;

        if (rawValue === undefined) {
            if (required) {
                throw new Error(
                    `${this.toStringShort()} cannot be undefined (${
                        this.fileName
                    })`,
                );
            }

            return null;
        }

        const value = Number(rawValue);

        if (Number.isNaN(value)) {
            throw new Error(
                `${this.toStringShort()} must be a number (${this.fileName})`,
            );
        }

        return value;
    }

    public getBooleanValue(name: string, required: true): boolean;
    public getBooleanValue(name: string, required?: false): boolean | null;
    public getBooleanValue(name: string, required = false): boolean | null {
        const value = this.children[name]?.at(0)?.textContent;

        if (value === undefined) {
            if (required) {
                throw new Error(
                    `${this.toStringShort()} cannot be undefined (${
                        this.fileName
                    })`,
                );
            }

            return null;
        }

        if (value === 'True') {
            return true;
        }

        if (value === 'False') {
            return false;
        }

        throw new Error(
            `${this.toStringShort()} must be True or False (${this.fileName})`,
        );
    }

    public getChildren(name?: string): ParsedNode[] {
        if (name !== undefined) {
            return this.children[name] ?? [];
        }

        return Object.values(this.children).flat();
    }

    public getChild(name: string, required: true): ParsedNode;
    public getChild(name: string, required?: false): ParsedNode | null;
    public getChild(name: string, required = false): ParsedNode | null {
        const value = this.children[name]?.at(0);

        if (value === undefined) {
            if (required) {
                throw new Error(
                    `${this.toStringShort()} cannot be undefined (${
                        this.fileName
                    })`,
                );
            }

            return null;
        }

        return value;
    }

    public getListContent(name: string, required: true): string[];
    public getListContent(name: string, required?: false): string[] | null;
    public getListContent(name: string, required = false): string[] | null {
        const values = this.children[name]?.at(0)?.children['li'];

        if (values === undefined) {
            if (required) {
                throw new Error(
                    `${this.toStringShort()} cannot be undefined (${
                        this.fileName
                    })`,
                );
            }

            return null;
        }

        return values.map((e) => e.textContent);
    }

    public toStringLong(): string {
        const children = Object.values(this.children).flat();
        const textContent = this.textContent.trim();

        let name = this.toStringShort();

        if (children.length > 0) {
            name += ` (${children.length.toString()})`;
        }

        if (textContent.length > 0) {
            name += `: ${textContent}`;
        }

        const childrenStr = children.map((e) =>
            e
                .toStringLong()
                .split('\n')
                .map((e) => '  ' + e)
                .join('\n'),
        );

        return [name, ...childrenStr, `File: ${this.fileName}`].join('\n');
    }

    public toStringShort(): string {
        let output;

        const name =
            this.getStringValue('defName') ?? this.getAttribute('Name');

        if (name !== null) {
            output = this.tagName + ' ' + name;
        } else {
            output = this.tagName;
        }

        if (this.parent !== undefined) {
            return this.parent.toStringShort() + '/' + output;
        }

        return output;
    }
}
