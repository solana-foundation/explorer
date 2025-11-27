import {
    type DisplayIdlType,
    getIdlSpecType,
    privateConvertType as convertType,
} from '../converters/convert-display-idl';

/**
 * Spec test for the implementation to display types in read-only mode
 */
describe('[idl] convert-display-idl', () => {
    describe('convertType', () => {
        it('should parse leaves', () => {
            const leavesTypeArg = { name: 'leaves', type: { vec: { defined: '(u8,[u8;32])' } } };
            expect(convertType(leavesTypeArg.type)).toEqual({
                vec: {
                    defined: {
                        generics: [],
                        name: '(u8,[u8;32])',
                    },
                },
            });
        });

        it('should parse type.option.tuple', () => {
            const type = { option: { tuple: ['u64', 'u64'] } } as DisplayIdlType;
            const expectedOutput = {
                option: {
                    defined: {
                        generics: [
                            { kind: 'type', type: 'u64' },
                            { kind: 'type', type: 'u64' },
                        ],
                        name: 'tuple[u64]',
                    },
                },
            };
            // @ts-expect-error expect type error
            expect(convertType(type)).toEqual(expectedOutput);
        });

        it('should parse type.vec.tuple', () => {
            const type = { vec: { tuple: ['string', 'string'] } };
            const expectedOutput = {
                vec: {
                    defined: {
                        generics: [
                            { kind: 'type', type: 'string' },
                            { kind: 'type', type: 'string' },
                        ],
                        name: 'tuple[string]',
                    },
                },
            };
            // @ts-expect-error expect type error
            expect(convertType(type)).toEqual(expectedOutput);
        });
    });

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
