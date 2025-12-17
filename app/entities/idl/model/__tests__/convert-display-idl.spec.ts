import { getIdlSpecType } from '../converters/convert-display-idl';

/**
 * Spec test for the implementation to display types in read-only mode
 */
describe('[idl] convert-display-idl', () => {
    describe('getIdlSpecType', async () => {
        describe('shank', () => {
            it('should return "legacy-shank" when parent is "legacy" and origin is "shank"', () => {
                const idl = {
                    metadata: {
                        origin: 'shank',
                    },
                };
                const result = getIdlSpecType(idl);
                expect(result).toBe('legacy-shank');
            });

            it('should return "legacy" when parent is "legacy" and origin is not "shank"', () => {
                const idl = {
                    metadata: {
                        origin: 'other',
                    },
                };
                const result = getIdlSpecType(idl);
                expect(result).toBe('legacy');
            });

            it('should return "legacy" when parent is "legacy" and origin is undefined', () => {
                const idl = {
                    metadata: {},
                };
                const result = getIdlSpecType(idl);
                expect(result).toBe('legacy');
            });

            it('should return "legacy" when parent is "legacy" and metadata is missing', () => {
                const idl = {};
                const result = getIdlSpecType(idl);
                expect(result).toBe('legacy');
            });
        });

        describe('non-legacy', () => {
            it('should preserve "codama" when parent returns "codama"', () => {
                const idl = {
                    standard: 'codama',
                };
                const result = getIdlSpecType(idl);
                expect(result).toBe('codama');
            });

            it('should not return "legacy-shank" when parent is "codama" even with shank origin', () => {
                const idl = {
                    metadata: {
                        origin: 'shank',
                    },
                    standard: 'codama',
                };
                const result = getIdlSpecType(idl);
                expect(result).toBe('codama');
            });

            it('should preserve "0.1.0" when parent returns "0.1.0"', () => {
                const idl = {
                    metadata: {
                        spec: '0.1.0',
                    },
                };
                const result = getIdlSpecType(idl);
                expect(result).toBe('0.1.0');
            });

            it('should not return "legacy-shank" when parent is "0.1.0" even with shank origin', () => {
                const idl = {
                    metadata: {
                        origin: 'shank',
                        spec: '0.1.0',
                    },
                };
                const result = getIdlSpecType(idl);
                expect(result).toBe('0.1.0');
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
