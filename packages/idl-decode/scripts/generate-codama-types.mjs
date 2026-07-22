// Build-time codegen from the sha-pinned codama-fixtures tarball; re-run after bumping the pin.
// The rendered renderers-js clients feed the tests' type-only AsDecoded imports.
import { renderVisitor } from '@codama/renderers-js';
import { visit } from 'codama';
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const OUT_DIR = fileURLToPath(new URL('../__tests__/generated/', import.meta.url));
const IDLS = 'codama-fixtures/packages/dynamic-client/test/programs/idls';

// codama rejects some stress fixtures (circular defaults, invalid deps) — reported, never silent
const RENDERED_CLIENTS = [
    'associated-token-account-idl.json',
    'blog-idl.json',
    'circular-account-refs-idl.json',
    'collection-types-idl.json',
    'custom-resolvers-test-idl.json',
    'example-idl.json',
    'mpl-token-metadata-idl.json',
    'pmp-idl.json',
    'sas-idl.json',
    'system-program-idl.json',
    'token-2022-idl.json',
    'token-idl.json',
].map(file => ({ idl: `${IDLS}/${file}`, out: file.replace('-idl.json', '-client') }));

const loadIdl = idl => JSON.parse(readFileSync(require.resolve(idl), 'utf8'));

mkdirSync(OUT_DIR, { recursive: true });
for (const { idl, out } of RENDERED_CLIENTS) {
    try {
        await visit(
            loadIdl(idl),
            renderVisitor(join(OUT_DIR, out), { deleteFolderBeforeRendering: true, formatCode: false }),
        );
        console.log('rendered', out);
    } catch (cause) {
        console.warn(`skipped ${out} — renderers-js rejected the document: ${cause.message}`);
    }
}
