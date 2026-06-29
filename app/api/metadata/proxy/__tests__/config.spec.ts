import { vi } from 'vitest';

// MAX_SIZE / TIMEOUT resolve their env overrides at module load, so each case
// stubs the env and re-imports config in isolation. The point of the guard is
// that a malformed override (e.g. "abc" → NaN) must NOT silently disable the
// size cap or timeout — it falls back to the default instead of failing open.
describe('metadata proxy config env validation', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    const loadConfig = () => import('../config');

    it('should use the 4 MB default when MAX_SIZE override is unset (empty)', async () => {
        vi.stubEnv('NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE', '');
        const { MAX_SIZE } = await loadConfig();
        expect(MAX_SIZE).toBe(4_000_000);
    });

    it('should use a valid positive-integer MAX_SIZE override', async () => {
        vi.stubEnv('NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE', '1000000');
        const { MAX_SIZE } = await loadConfig();
        expect(MAX_SIZE).toBe(1_000_000);
    });

    it.each(['abc', '0', '-1', '1.5', 'NaN'])(
        'should fall back to the default (never NaN) for a malformed MAX_SIZE %j',
        async raw => {
            vi.stubEnv('NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE', raw);
            const { MAX_SIZE } = await loadConfig();
            expect(MAX_SIZE).toBe(4_000_000);
            expect(Number.isNaN(MAX_SIZE)).toBe(false);
        },
    );

    it('should fall back to the 10 s default for a malformed TIMEOUT', async () => {
        vi.stubEnv('NEXT_PUBLIC_METADATA_TIMEOUT', 'abc');
        const { TIMEOUT } = await loadConfig();
        expect(TIMEOUT).toBe(10_000);
    });

    it('should use a valid positive-integer TIMEOUT override', async () => {
        vi.stubEnv('NEXT_PUBLIC_METADATA_TIMEOUT', '5000');
        const { TIMEOUT } = await loadConfig();
        expect(TIMEOUT).toBe(5_000);
    });
});
