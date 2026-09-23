import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

// On this date, every exempted release is older than `minimumReleaseAge`.
const EXPIRES_ON = Date.parse('2026-09-25T00:00:00Z');

function expiredExemptions(workspace: string, now: number): string[] {
    if (now < EXPIRES_ON) return [];
    return workspace
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith("- '") && line.endsWith("'"))
        .map(line => line.slice(3, -1))
        .filter(name => name.startsWith('@solana/'));
}

describe('release-age exemptions', () => {
    const workspace = readFileSync(path.join(process.cwd(), 'pnpm-workspace.yaml'), 'utf8');

    test('should report nothing the day before the exemptions expire', () => {
        expect(expiredExemptions(workspace, EXPIRES_ON - 1)).toEqual([]);
    });

    test('should report the kit exemptions on the day they expire', () => {
        expect(expiredExemptions(workspace, EXPIRES_ON)).toContain('@solana/kit');
    });

    test('should carry no expired exemption', () => {
        expect(expiredExemptions(workspace, Date.now())).toEqual([]);
    });
});
