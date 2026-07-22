// Generates a committed Codama literal module from the invoking package's Anchor IDL.
// Run from a program package (`pnpm run generate:codama`); the package opts in via
// `explorer.codamaFromAnchor` in its package.json ({ source?, target?, exportName?, programAddress? }).
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const dir = process.cwd();
const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));

const configs = normalizeConfigs(pkg.explorer?.codamaFromAnchor);
if (!configs.length) throw new Error(`${pkg.name}: package.json declares no explorer.codamaFromAnchor`);

const generated = [];
for (const config of configs) {
    const source = config.source ?? pkg.exports?.['./idl'];
    const target = config.target ?? pkg.exports?.['./codama'];
    const exportName = config.exportName ?? `${basename(dir).replace(/-(\w)/g, (_, c) => c.toUpperCase())}Idl`;

    if (!source || !target) {
        throw new Error(`${pkg.name}: codamaFromAnchor requires source/target or exports './idl'/'./codama'`);
    }

    const idl = JSON.parse(readFileSync(join(dir, source), 'utf8'));
    const root = rootNodeFromAnchor(idl);
    const output = config.programAddress
        ? { ...root, program: { ...root.program, publicKey: config.programAddress } }
        : root;

    writeFileSync(
        join(dir, target),
        `// Generated from ${source} by test-anchor-programs/generate-codama.mjs; edit the Anchor IDL, then re-run \`pnpm run generate:codama\`.\n` +
            `export const ${exportName} = ${JSON.stringify(output, null, 4)} as const;\n`,
    );
    generated.push(target);
    console.log('generated', join(basename(dir), target));
}

execFileSync('pnpm', ['exec', 'oxfmt', ...generated], { stdio: 'inherit' });

function normalizeConfigs(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}
