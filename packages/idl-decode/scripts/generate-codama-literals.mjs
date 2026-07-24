// Regenerates each test-codama-programs literal module ('.') from its raw JSON twin ('./idl').
// The JSON is the source of truth; the literal must be a TS module because JSON imports widen and
// erase the literal field names/formats that payload inference reads.
import { identityVisitor, visit } from 'codama';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROGRAMS_DIR = fileURLToPath(new URL('../test-codama-programs/', import.meta.url));

const generated = [];
for (const entry of readdirSync(PROGRAMS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pkg = JSON.parse(readFileSync(join(PROGRAMS_DIR, entry.name, 'package.json'), 'utf8'));
    const jsonEntry = pkg.exports?.['./idl'];
    if (!jsonEntry) throw new Error(`${pkg.name}: expected exports './idl' (raw JSON)`);
    const root = JSON.parse(readFileSync(join(PROGRAMS_DIR, entry.name, jsonEntry), 'utf8'));
    // validation only — the identity visitor throws on malformed kinds, but its output is NOT
    // serialized: it rebuilds nodes through constructors, which re-stamps versions and drops fields
    visit(root, identityVisitor());
    // no '.' TS export → a raw-JSON-only fixture (consumed wide, e.g. tokenkeg) — nothing to generate
    const tsEntry = pkg.exports?.['.'];
    if (!tsEntry?.endsWith('.ts')) continue;
    const exportName = `${entry.name.replace(/-(\w)/g, (_, c) => c.toUpperCase())}Idl`;
    writeFileSync(
        join(PROGRAMS_DIR, entry.name, tsEntry),
        `// Generated from ${jsonEntry} by scripts/generate-codama-literals.mjs — edit the JSON, then re-run (pretest does).\n` +
            `export const ${exportName} = ${JSON.stringify(root, null, 4)} as const;\n`,
    );
    generated.push(join(PROGRAMS_DIR, entry.name, tsEntry));
    console.log('generated', join(entry.name, tsEntry));
}
execFileSync('pnpm', ['exec', 'oxfmt', ...generated], { stdio: 'inherit' });
