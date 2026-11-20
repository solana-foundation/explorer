import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/* Fonts for the generated Open Graph images. */

type OgFont = {
    data: ArrayBuffer;
    name: string;
    style: 'normal';
    weight: OgFontWeight;
};

const FONTS_DIR = join(process.cwd(), 'public', 'fonts');

// Each face names its file in a literal, so this module can read only these files.
const FACES = [
    { name: 'Rubik', read: () => readFile(join(FONTS_DIR, 'Rubik-Regular.ttf')), weight: 400 },
    { name: 'Rubik', read: () => readFile(join(FONTS_DIR, 'Rubik-Medium.ttf')), weight: 500 },
    { name: 'Rubik', read: () => readFile(join(FONTS_DIR, 'Rubik-SemiBold.ttf')), weight: 600 },
    { name: 'Roboto Mono', read: () => readFile(join(FONTS_DIR, 'RobotoMono-Regular.ttf')), weight: 400 },
    { name: 'Roboto Mono', read: () => readFile(join(FONTS_DIR, 'RobotoMono-Medium.ttf')), weight: 500 },
    { name: 'Roboto Mono', read: () => readFile(join(FONTS_DIR, 'RobotoMono-SemiBold.ttf')), weight: 600 },
] as const;

type OgFontFace = (typeof FACES)[number];
export type OgFontFamily = OgFontFace['name'];
export type OgFontWeight = OgFontFace['weight'];
export type OgFontOption = {
    family: OgFontFamily;
    weights?: readonly OgFontWeight[];
};

const ALL_FONTS: readonly OgFontOption[] = [...new Set(FACES.map(({ name }) => name))].map(family => ({ family }));
const cache = new Map<OgFontFace, Promise<ArrayBuffer>>();

export async function loadOgFonts(fontOptions: readonly OgFontOption[] = ALL_FONTS): Promise<OgFont[]> {
    const faces = fontOptions.flatMap(({ family, weights }) =>
        FACES.filter(face => face.name === family && (weights?.includes(face.weight) ?? true)),
    );
    return Promise.all(
        faces.map(async (face): Promise<OgFont> => ({
            data: await readFontCached(face),
            name: face.name,
            style: 'normal',
            weight: face.weight,
        })),
    );
}

function readFontCached(face: OgFontFace): Promise<ArrayBuffer> {
    const cached = cache.get(face);
    if (cached) return cached;

    const bytes = readFont(face).catch(error => {
        cache.delete(face);
        throw error;
    });
    cache.set(face, bytes);

    return bytes;
}

async function readFont(face: OgFontFace): Promise<ArrayBuffer> {
    const bytes = await face.read();
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
