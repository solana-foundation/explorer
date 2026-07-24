// Conversion sweep over every committed Anchor fixture — guards the nodes-from-anchor route
// (including the patched v0.1 alias behaviour) against fixture and dependency drift: every
// anchor document exported by a test-anchor-programs package must convert.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { convertToCodama } from '../anchor/convert';
import type { AnchorIdl } from '../types';
import { unwrapResult } from './fixtures';

const PROGRAMS_DIR = fileURLToPath(new URL('../../test-anchor-programs/', import.meta.url));

const isCodamaRoot = (doc: unknown): boolean =>
    typeof doc === 'object' && doc !== null && 'kind' in doc && doc.kind === 'rootNode';

const anchorDocuments = readdirSync(PROGRAMS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .flatMap(entry => {
        const dir = join(PROGRAMS_DIR, entry.name);
        const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
            exports: Record<string, string>;
        };
        return Object.entries(pkg.exports)
            .filter(([name]) => name === './idl' || name.endsWith('-idl'))
            .map(([name, file]) => ({
                doc: JSON.parse(readFileSync(join(dir, file), 'utf8')) as unknown,
                name: `${entry.name}:${name}`,
            }));
    })
    .filter(({ doc }) => !isCodamaRoot(doc));

describe('Anchor fixture conversion sweep', () => {
    it('should discover anchor documents among the fixtures', () => {
        expect(anchorDocuments.length).toBeGreaterThan(0);
    });

    // legacy (v0.0) documents ride the same cast the runtime route uses
    it.each(anchorDocuments)('should convert $name with nodes-from-anchor', ({ doc }) => {
        const root = unwrapResult(convertToCodama(doc as AnchorIdl));

        expect(root.program.instructions.length).toBeGreaterThan(0);
    });
});
