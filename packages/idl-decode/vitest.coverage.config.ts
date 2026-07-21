import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const src = (path: string): string => fileURLToPath(new URL(`src/${path}`, import.meta.url));

// Coverage-only harness running BOTH suite layers over the same src files. The integration layer
// normally consumes dist (the built-package contract), which oxc emits without sourcemaps — for
// coverage attribution the package entries are aliased back to src; contract runs stay on dist.
export default defineConfig({
    test: {
        coverage: {
            enabled: true,
            // client sources only — specs (colocated `__tests__` included), fixtures, and generated artifacts are not the measured code
            exclude: ['src/**/__tests__/**'],
            include: ['src/**'],
            // the gate, not a report — the figure decays silently from the first uncovered PR otherwise
            thresholds: { branches: 100, functions: 100, lines: 100, statements: 100 },
        },
        projects: [
            {
                test: {
                    include: ['src/**/*.spec.ts'],
                    name: 'unit',
                    // type suites execute nothing (no line coverage) but must still run and gate
                    typecheck: { enabled: true, include: ['src/**/*.spec-d.ts'] },
                },
            },
            {
                resolve: {
                    alias: [
                        { find: '@explorer/idl-decode/anchor', replacement: src('anchor/index.ts') },
                        { find: '@explorer/idl-decode/codama', replacement: src('codama/index.ts') },
                        { find: '@explorer/idl-decode/fetch', replacement: src('fetch/index.ts') },
                        { find: '@explorer/idl-decode', replacement: src('index.ts') },
                    ],
                },
                test: { include: ['__tests__/**/*.spec.ts'], name: 'integration' },
            },
        ],
    },
});
