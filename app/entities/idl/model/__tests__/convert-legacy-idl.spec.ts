import { getIdlSpecType } from '../converters/convert-legacy-idl';

/**
 * Spec test for the improved implementation for the Explorer
 */
describe('[idl] convert-legacy-idl', () => {
    describe('getIdlSpecType', async () => {
        describe('codama', () => {
            it.each([
                ['a Codama root', 'codama'],
                ['a Kinobi root', 'kinobi'],
            ])('should return "codama" for %s', (_label, standard) => {
                expect(getIdlSpecType({ kind: 'rootNode', standard })).toBe('codama');
            });

            it('should prioritize the root node kind over metadata.spec when both exist', () => {
                const idl = {
                    kind: 'rootNode',
                    metadata: { spec: '0.1.0' },
                    standard: 'codama',
                };
                const result = getIdlSpecType(idl);
                expect(result).toBe('codama');
            });

            it.each([
                ['a different value', 'programNode'],
                ['a different case', 'RootNode'],
                ['a longer string', 'rootNode-v2'],
            ])('should not return "codama" when kind is %s', (_label, kind) => {
                expect(getIdlSpecType({ kind, standard: 'codama' })).toBe('legacy');
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
