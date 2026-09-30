import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const fixtureDir = mkdtempSync(join('app/features', 'boundaries-check-'));

function lint(source, name) {
    const file = join(fixtureDir, name);
    writeFileSync(file, source);
    return spawnSync(
        process.execPath,
        [join('node_modules', 'oxlint', 'bin', 'oxlint'), '--disable-nested-config', file],
        {
            encoding: 'utf8',
        },
    );
}

try {
    const allowed = lint("import '@shared/lib/logger';\n", 'allowed.ts');
    assert.equal(allowed.status, 0, allowed.stderr || allowed.stdout);

    const forbidden = lint("import '@features/search';\n", 'forbidden.ts');
    assert.notEqual(forbidden.status, 0, 'Cross-feature import was allowed');
    assert.ok((forbidden.stderr + forbidden.stdout).includes('boundaries(dependencies)'));
} finally {
    rmSync(fixtureDir, { recursive: true, force: true });
}
