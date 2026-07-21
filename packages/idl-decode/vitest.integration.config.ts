import { defineConfig } from 'vitest/config';

// Demonstration suite: end-to-end consumer flows over the BUILT package (dist) and the generated
// program IDLs. Lives outside src/ on purpose. Run: `pnpm --filter @explorer/idl-decode test:integration`.
export default defineConfig({
    test: {
        include: ['__tests__/**/*.spec.ts'],
    },
});
