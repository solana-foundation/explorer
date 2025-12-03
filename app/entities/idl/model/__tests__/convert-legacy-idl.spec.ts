import { getIdlSpecType } from '../converters/convert-legacy-idl';

/**
 * Spec test for the improved implementation for the Explorer
 */
describe('[idl] convert-legacy-idl', () => {
    describe('getIdlSpecType', async () => {
        describe('codama', () => {
            it('should return "codama" when idl.standard is "codama"', () => {
                const idl = { standard: 'codama' };
                const result = getIdlSpecType(idl);
                expect(result).toBe('codama');
            });

            it('should prioritize standard over metadata.spec when both exist', () => {
                const idl = {
                    metadata: { spec: '0.1.0' },
                    standard: 'codama',
                };
                const result = getIdlSpecType(idl);
                expect(result).toBe('codama');
            });

            it('should not return "codama" when standard is a different value', () => {
                const idl = { standard: 'other' };
                const result = getIdlSpecType(idl);
                expect(result).toBe('legacy');
            });

            it('should be case-sensitive for standard === "codama"', () => {
                const idl = { standard: 'Codama' };
                const result = getIdlSpecType(idl);
                expect(result).toBe('legacy');
            });

            it('should not match partial string "codama"', () => {
                const idl = { standard: 'codama-v2' };
                const result = getIdlSpecType(idl);
                expect(result).toBe('legacy');
            });
        });

        describe('metadata.spec', () => {
            it('should return "0.1.0" when idl.metadata.spec is "0.1.0"', () => {
                const idl = { metadata: { spec: '0.1.0' } };
                const result = getIdlSpecType(idl);
                expect(result).toBe('0.1.0');
            });

            it('should return "legacy" when idl.metadata.spec is "legacy"', () => {
                const idl = { metadata: { spec: 'legacy' } };
                const result = getIdlSpecType(idl);
                expect(result).toBe('legacy');
            });

            it('should return "codama" when idl.metadata.spec is "codama"', () => {
                const idl = { metadata: { spec: 'codama' } };
                const result = getIdlSpecType(idl);
                expect(result).toBe('codama');
            });

            it('should return metadata.spec value even if not a known IdlSpec type', () => {
                // The function doesn't validate the spec value, just returns it
                const idl = { metadata: { spec: 'unknown-spec' } };
                const result = getIdlSpecType(idl);
                expect(result).toBe('unknown-spec');
            });
        });

        describe('edge cases', () => {
            it('should return "legacy" when idl is nil', () => {
                expect(getIdlSpecType(null)).toBe('legacy');
                expect(getIdlSpecType(undefined)).toBe('legacy');
            });
        });
    });
});
