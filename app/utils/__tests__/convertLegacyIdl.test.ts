import { LegacyOrShankIdlType, privateConvertType } from '../convertLegacyIdl';

// TODO: cover other variants
describe('IDL::convertType', () => {
    it('parses type.option.tuple', () => {
        const type = { option: { tuple: ['u64', 'u64'] } };
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
        expect(privateConvertType(type as unknown as LegacyOrShankIdlType)).toEqual(expectedOutput);
    });

    it('parses type.vec.tuple', () => {
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
        expect(privateConvertType(type as unknown as LegacyOrShankIdlType)).toEqual(expectedOutput);
    });
});
