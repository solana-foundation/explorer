// Re-downloads the invoking package's vendored IDL artifacts from their upstream repository.
// Run from a program package (`pnpm run download:idl`); the package opts in via
// `explorer.vendoredIdl` in its package.json ([{ source, target }]).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.cwd();
const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));

const files = normalizeEntries(pkg.explorer?.vendoredIdl);
if (!files.length) throw new Error(`${pkg.name}: package.json declares no explorer.vendoredIdl`);

const downloaded = [];
for (const { source, target } of files) {
    if (!source || !target) throw new Error(`${pkg.name}: vendoredIdl entries require source and target`);
    const response = await fetch(source);
    if (!response.ok) throw new Error(`${source}: ${response.status} ${response.statusText}`);
    const body = await response.text();
    // IDL JSON is committed minified (parse doubles as validation); the pretty upstream original stays one `source` away
    const content = target.endsWith('.json') ? `${JSON.stringify(JSON.parse(body))}\n` : body;
    writeFileSync(join(dir, target), content);
    downloaded.push(target);
    console.log('downloaded', target);
}

// committed .ts snapshots follow the package format; .idl.json stays as written above (minified, not oxfmt'd)
const formatTargets = downloaded.filter(target => target.endsWith('.ts'));
if (formatTargets.length) execFileSync('pnpm', ['exec', 'oxfmt', ...formatTargets], { stdio: 'inherit' });

function normalizeEntries(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}
