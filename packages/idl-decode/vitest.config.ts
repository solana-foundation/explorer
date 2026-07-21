import { defineConfig } from 'vitest/config';

// Unit suite (src only) — the demonstration suite in __tests__/ runs separately via vitest.integration.config.ts.
export default defineConfig({
    test: {
        include: ['src/**/*.spec.ts'],
        typecheck: {
            enabled: true,
            include: ['src/**/*.spec-d.ts'],
        },
    },
});
