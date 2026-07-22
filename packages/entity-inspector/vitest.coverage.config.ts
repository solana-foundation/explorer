import { defineConfig } from 'vitest/config';

// Coverage harness over src. Thresholds are the gate, not a report — the figure decays silently
// from the first uncovered PR otherwise.
export default defineConfig({
    test: {
        coverage: {
            enabled: true,
            // client sources only — colocated specs are not the measured code
            exclude: ['src/**/__tests__/**'],
            include: ['src/**'],
            thresholds: { branches: 100, functions: 100, lines: 100, statements: 100 },
        },
        include: ['src/**/*.spec.ts'],
    },
});
