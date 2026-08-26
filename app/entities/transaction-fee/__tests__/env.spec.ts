import { isSimd0553FeeEnabled } from '../env';

describe('isSimd0553FeeEnabled', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('should be enabled when the flag is exactly "true"', () => {
        vi.stubEnv('NEXT_PUBLIC_SIMD_0553_FEE_ENABLED', 'true');

        expect(isSimd0553FeeEnabled()).toBe(true);
    });

    it('should be disabled when the flag is unset', () => {
        vi.stubEnv('NEXT_PUBLIC_SIMD_0553_FEE_ENABLED', undefined);

        expect(isSimd0553FeeEnabled()).toBe(false);
    });

    it('should be disabled for any value other than "true"', () => {
        for (const value of ['false', '1', 'TRUE', 'yes', '']) {
            vi.stubEnv('NEXT_PUBLIC_SIMD_0553_FEE_ENABLED', value);

            expect(isSimd0553FeeEnabled()).toBe(false);
        }
    });

    it('should follow the flag when it changes at runtime, not freeze at import', () => {
        vi.stubEnv('NEXT_PUBLIC_SIMD_0553_FEE_ENABLED', 'true');
        expect(isSimd0553FeeEnabled()).toBe(true);

        vi.stubEnv('NEXT_PUBLIC_SIMD_0553_FEE_ENABLED', 'false');
        expect(isSimd0553FeeEnabled()).toBe(false);
    });
});
