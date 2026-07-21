// Copies built Anchor fixture artifacts (IDL JSON + companion TS type) into committed snapshots,
// so the suite reads them without the Rust/Anchor toolchain. Runs after `anchor build` (see
// build:programs); the committed copies are what tests and typecheck consume.
//
// Derived Codama literal modules are generated separately by each program's `generate:codama` script.
import { copyFileSync, existsSync } from 'node:fs';

const ROOT = new URL('./', import.meta.url);

const PROGRAMS = [
    {
        dir: 'simple',
        packageName: '@explorer/test-idl-program-simple',
        snapshots: [
            { from: 'target/idl/simple.json', to: 'simple.idl.json' },
            { from: 'target/types/simple.ts', to: 'simple.ts' },
        ],
    },
    {
        dir: 'simple-031',
        packageName: '@explorer/test-idl-program-simple-031',
        snapshots: [
            { from: 'target/idl/simple_031.json', to: 'simple_031.idl.json' },
            { from: 'target/types/simple_031.ts', to: 'simple_031.ts' },
        ],
    },
];

const filters = process.argv.slice(2);
const selected = filters.length
    ? PROGRAMS.filter(
          program => filters.includes(program.dir.split('/').pop()) || filters.includes(program.packageName),
      )
    : PROGRAMS;

if (!selected.length) {
    throw new Error(`no Anchor fixture program matched: ${filters.join(', ')}`);
}

for (const program of selected) {
    for (const { from, to } of program.snapshots) {
        const src = new URL(`${program.dir}/${from}`, ROOT);
        if (!existsSync(src)) {
            throw new Error(
                `missing ${program.dir}/${from} — run \`pnpm run build:programs\` (Anchor toolchain) first`,
            );
        }
        const dest = new URL(`${program.dir}/${to}`, ROOT);
        copyFileSync(src, dest);
        console.log('copied', `${program.dir}/${from}`, '->', to);
    }
}
