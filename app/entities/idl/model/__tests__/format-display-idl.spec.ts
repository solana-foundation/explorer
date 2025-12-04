import { renderHook } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';

import anchor029Devi from '../../mocks/anchor/anchor-0.29.0-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchor030devi from '../../mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchorLegacy094ShankWave from '../../mocks/anchor/anchor-legacy-0.9.4-shank-waveQX2yP3H1pVU8djGvEHmYg8uamQ84AuyGtpsrXTF.json';
import anchorLegacyAccountComp from '../../mocks/anchor/anchor-legacy-account_compression-compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq.json';
import { formatDisplayIdl, getFormattedIdl } from '../../model/formatters/format';
import { useFormatAnchorIdl } from '../../model/use-format-anchor-idl';

function toLengths(result: any) {
    return Object.keys(result ?? {}).map(field => {
        const obj: Record<string, any> = result as NonNullable<any>;
        return result ? obj[field]?.length : undefined;
    });
}

describe('formatDisplayIdl', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each([
        ['devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH', anchor029Devi, [8, 0, 42, 11, 23, 0, 5]],
        ['devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH', anchor030devi, [8, undefined, 42, 11, 23, 0, 9]],
        ['waveQX2yP3H1pVU8djGvEHmYg8uamQ84AuyGtpsrXTF', anchorLegacy094ShankWave, [5, 0, 30, 0, 56, 0, 11]],
        ['compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq', anchorLegacyAccountComp, [9, 16, 27, 0, 13, 0, 4]],
    ])(
        'should display %s program idl via useFormatAnchorIdl hook',
        (fallbackId: string, idl: any, structure: (number | undefined)[]) => {
            const programAddress = idl.metadata?.address ?? fallbackId;
            const programId = programAddress || fallbackId;

            expect(() => {
                const formattedIdl = getFormattedIdl(formatDisplayIdl, idl, programId);
                expect(formattedIdl.address).toEqual(programId);

                const { result } = renderHook(() => useFormatAnchorIdl(formattedIdl));
                expect(toLengths(result.current)).toEqual(structure);
            }).not.toThrowError();
        }
    );
});
