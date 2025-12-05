import { privateConvertType as convertType } from '../converters/convert-reference-legacy-idl';

/**
 * Spec test for the reference implementation from @solana-developers/helpers
 */
describe('[idl] convert-reference-legacy-idl', () => {
    describe('convertType', () => {
        it('should parse leaves as described, without casting into supported type', () => {
            const leavesTypeArg = { name: 'leaves', type: { vec: { defined: '(u8,[u8;32])' } } };
            expect(convertType(leavesTypeArg.type)).toEqual({
                vec: { defined: { generics: [], name: '(u8,[u8;32])' } },
            });
        });

        it('should not parse type.option.tuple', () => {
            const type = { option: { tuple: ['u64', 'u64'] } };
            expect(() => convertType(type)).toThrow(new Error('Unsupported type: {"tuple":["u64","u64"]}'));
        });

        it('should not parse type.vec.tuple', () => {
            const type = { vec: { tuple: ['string', 'string'] } };
            expect(() => convertType(type)).toThrow(new Error('Unsupported type: {"tuple":["string","string"]}'));
        });
    });
});
