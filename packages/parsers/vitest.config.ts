import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['src/**/*.spec.ts'],
        // Type-level pins run as reported tests here; inside a runtime `it` they assert nothing.
        typecheck: { enabled: true, include: ['src/**/*.spec-d.ts'] },
    },
});
