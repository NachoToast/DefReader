import { cpSync, existsSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import config from '../config.json';
import { DLC, ModExport } from './exported/index.js';
import { Mapper } from './Mapper.js';
import { readAllDefs } from './parsing.js';

interface Config {
    gameDir: string;
    modDir?: string;
}

const { gameDir } = config as Config;

const outDir = join(import.meta.dirname, '..', 'gen');

function main(): void {
    const allNodes = readAllDefs(join(gameDir, 'Core'));

    for (const dlc of [DLC.Biotech]) {
        const path = join(gameDir, dlc);
        if (existsSync(path)) {
            allNodes.push(...readAllDefs(path));
        }
    }

    const res = new Mapper(allNodes).mapAll();

    const modExport = {
        concreteDefCount: 0,
        abstractDefCount: 0,
    } as ModExport;

    for (const [key, { concrete, abstractCount }] of Object.entries(res)) {
        const numDone = Object.keys(concrete).length;

        console.log(
            `Generated ${numDone.toString()} ${key} (${abstractCount.toString()} abstract)`,
        );

        modExport[key as 'otherDefs'] = concrete;

        modExport.concreteDefCount += numDone;
        modExport.abstractDefCount += abstractCount;
    }

    readdirSync(outDir).forEach((f) => {
        if (f !== '.gitkeep') {
            rmSync(join(outDir, f), { recursive: true });
        }
    });

    cpSync(join(import.meta.dirname, 'exported'), join(outDir, 'types'), {
        recursive: true,
    });

    writeFileSync(
        join(outDir, 'data.json'),
        JSON.stringify(modExport, undefined, 4),
        { encoding: 'utf-8' },
    );
}

main();
