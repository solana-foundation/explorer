import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['src/**/*.spec.ts'],
        typecheck: { enabled: true, include: ['src/**/*.spec-d.ts'] },
    },
});
