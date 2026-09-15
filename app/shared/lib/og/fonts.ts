import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/* Fonts for the generated Open Graph images. */

type OgFont = {
    data: ArrayBuffer;
    name: string;
    style: 'normal';
    weight: OgFontWeight;
};

const WEIGHTS = [
    { file: 'Regular', weight: 400 },
    { file: 'Medium', weight: 500 },
    { file: 'SemiBold', weight: 600 },
] as const;

const FAMILIES = [
    { file: 'Rubik', name: 'Rubik' },
    { file: 'RobotoMono', name: 'Roboto Mono' },
] as const;

export type OgFontFamily = (typeof FAMILIES)[number]['name'];
export type OgFontWeight = (typeof WEIGHTS)[number]['weight'];
export type OgFontOption = {
    family: OgFontFamily;
    weights?: readonly OgFontWeight[];
};

const FILE_PREFIX = new Map<OgFontFamily, string>(FAMILIES.map(({ file, name }) => [name, file]));
const ALL_FONTS: readonly OgFontOption[] = FAMILIES.map(({ name }) => ({ family: name }));
const cache = new Map<string, Promise<ArrayBuffer>>();

export async function loadOgFonts(fontOptions: readonly OgFontOption[] = ALL_FONTS): Promise<OgFont[]> {
    const faces = fontOptions.flatMap(({ family, weights }) =>
        WEIGHTS.filter(({ weight }) => weights?.includes(weight) ?? true).map(({ file, weight }) => ({
            name: family,
            path: join(process.cwd(), 'public', 'fonts', `${FILE_PREFIX.get(family)}-${file}.ttf`),
            weight,
        })),
    );
    const data = await Promise.all(faces.map(({ path }) => readFontCached(path)));

    return faces.map((face, index) => ({
        data: data[index],
        name: face.name,
        style: 'normal',
        weight: face.weight,
    }));
}

function readFontCached(path: string): Promise<ArrayBuffer> {
    const cached = cache.get(path);
    if (cached) return cached;

    const bytes = readFont(path).catch(error => {
        cache.delete(path);
        throw error;
    });
    cache.set(path, bytes);

    return bytes;
}

async function readFont(path: string): Promise<ArrayBuffer> {
    const bytes = await readFile(path);
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
