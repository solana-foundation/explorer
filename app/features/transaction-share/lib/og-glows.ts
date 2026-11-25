import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { toBase64 } from '@/app/shared/lib/bytes';

/* The glow png background, one per transaction status.
 *
 * A raster rather than a CSS `radial-gradient`, because the asset carries a grey noise layer.
 * PNG rather than the WebP, because satori cannot decode WebP - it fails with `u2 is not iterable`.
 *
 * Handed on as data URIs because satori resolves no relative URL. Read off disk rather than inlined as
 * base64 in source: the two together are 1 MB of base64 in the module graph, against a read and encode that
 * happens once per instance in front of a render that costs far more.
 */

/** What {@link loadOgGlows} hands back, one base64 PNG data URI per transaction status. */
export type OgGlows = {
    failed: string;
    success: string;
};

const GLOW_DIR = join(process.cwd(), 'public', 'img', 'og');
const PINK_GLOW_PATH = join(GLOW_DIR, 'pink_gradient.png');
const GREEN_GLOW_PATH = join(GLOW_DIR, 'green_gradient.png');

let cached: Promise<OgGlows> | undefined;

/**
 * Both glows as base64 PNG data URIs, read once per instance.
 */
export function loadOgGlows(): Promise<OgGlows> {
    if (!cached)
        cached = readGlowFiles().catch(error => {
            cached = undefined;
            throw error;
        });

    return cached;
}

/**
 * Both files, read off disk in one parallel pass.
 */
async function readGlowFiles(): Promise<OgGlows> {
    const [failed, success] = await Promise.all([readFile(PINK_GLOW_PATH), readFile(GREEN_GLOW_PATH)]);

    return { failed: toPngDataUri(failed), success: toPngDataUri(success) };
}

function toPngDataUri(bytes: Uint8Array): string {
    return `data:image/png;base64,${toBase64(bytes)}`;
}
