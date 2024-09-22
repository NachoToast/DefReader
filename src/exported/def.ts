export interface Def {
    defName: string;

    label: string;

    description: string;
}

export interface DefNameAndCount {
    defName: Def['defName'];

    count: number;
}
