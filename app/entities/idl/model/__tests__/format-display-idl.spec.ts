import anchor029Devi from '../../mocks/anchor/anchor-0.29.0-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchor030devi from '../../mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchorLegacy094ShankWave from '../../mocks/anchor/anchor-legacy-0.9.4-shank-waveQX2yP3H1pVU8djGvEHmYg8uamQ84AuyGtpsrXTF.json';
import anchorLegacyAccountComp from '../../mocks/anchor/anchor-legacy-account_compression-compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq.json';
import { formatAnchorIdl } from '../../model/anchor/use-format-anchor-idl';
import { formatDisplayIdl, getFormattedIdl } from '../../model/formatters/format';

function toLengths(result: any) {
    return Object.keys(result ?? {}).map(field => {
        const obj: Record<string, any> = result as NonNullable<any>;
        return result ? obj[field]?.length : undefined;
    });
}

describe('formatDisplayIdl', () => {
    it.each([
        ['devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH', anchor029Devi, [8, 0, 42, 11, 23, 0, 5]],
        ['devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH', anchor030devi, [8, undefined, 42, 11, 23, 0, 9]],
        ['waveQX2yP3H1pVU8djGvEHmYg8uamQ84AuyGtpsrXTF', anchorLegacy094ShankWave, [5, 0, 30, 0, 56, 0, 11]],
        ['compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq', anchorLegacyAccountComp, [9, 16, 27, 0, 13, 0, 4]],
    ])(
        'should display %s program idl via formatAnchorIdl',
        (fallbackId: string, idl: any, structure: (number | undefined)[]) => {
            const programAddress = idl.metadata?.address ?? fallbackId;
            const programId = programAddress || fallbackId;

            expect(() => {
                const formattedIdl = getFormattedIdl(formatDisplayIdl, idl, programId);
                expect(formattedIdl.address).toEqual(programId);

                expect(toLengths(formatAnchorIdl(formattedIdl))).toEqual(structure);
            }).not.toThrowError();
        },
    );

    it('should handle constants with invalid JSON', () => {
        const programId = 'compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq';

        const constants = formatAnchorIdl(
            getFormattedIdl(formatDisplayIdl, anchorLegacyAccountComp, programId),
        ).constants;

        expect(constants).toHaveLength(16);
        expect(constants?.[13]).toMatchObject({
            name: 'ADDRESS_QUEUE_VALUES',
            type: 'u16',
            value: '28_807',
        });
        expect(constants?.[15]).toMatchObject({
            name: 'NOOP_PUBKEY',
            type: 'array(u8, 32)',
            value: '[11 , 188 , 15 , 192 , 187 , 71 , 202 , 47 , 116 , 196 , 17 , 46 , 148 , 171 , 19 , 207 , 163 , 198 , 52 , 229 , 220 , 23 , 234 , 203 , 3 , 205 , 26 , 35 , 205 , 126 , 120 , 124 ,]',
        });
    });
});
