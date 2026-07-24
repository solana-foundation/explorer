// Builds dist/ with oxc-transform: per-file JS + .d.ts emit via isolated declarations (no tsc emit).
// Typechecking stays with `pnpm typecheck` — oxc transforms, it does not check.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'oxc-transform';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(packageRoot, 'src');
const distDir = join(packageRoot, 'dist');

const sources = (await readdir(srcDir, { recursive: true })).filter(
    path => path.endsWith('.ts') && !path.includes('__tests__'),
);

let failed = false;
for (const relativePath of sources) {
    const sourceText = await readFile(join(srcDir, relativePath), 'utf8');
    const {
        code,
        declaration,
        errors = [],
    } = await transform(relativePath, sourceText, {
        typescript: { declaration: { stripInternal: false } },
    });
    if (errors.length > 0) {
        failed = true;
        console.error(`✖ ${relativePath}`);
        for (const error of errors) console.error(error.message);
        continue;
    }
    const outBase = join(distDir, relativePath.replace(/\.ts$/, ''));
    await mkdir(dirname(outBase), { recursive: true });
    await writeFile(`${outBase}.js`, code);
    await writeFile(`${outBase}.d.ts`, declaration);
}

if (failed) process.exit(1);
console.log(`built ${sources.length} modules → dist/`);
