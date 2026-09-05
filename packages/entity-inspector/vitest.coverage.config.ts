import { defineConfig, mergeConfig } from 'vitest/config';

import base from './vitest.config';

// Coverage harness over src, extending the base config so the spec globs cannot drift apart.
// Thresholds are the gate, not a report — the figure decays silently from the first uncovered PR otherwise.
export default mergeConfig(
    base,
    defineConfig({
        test: {
            coverage: {
                enabled: true,
                // client sources only — colocated specs are not the measured code
                exclude: ['src/**/__tests__/**'],
                include: ['src/**'],
                thresholds: { branches: 100, functions: 100, lines: 100, statements: 100 },
            },
        },
    }),
);
