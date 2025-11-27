import { formatDisplayIdl, getFormattedIdl } from '@entities/idl';
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import anchorLegacyAccountComp from '../../mocks/anchor/anchor-legacy-account_compression-compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq.json';
import { useFormatAnchorIdl } from '../use-format-anchor-idl';

// Mock byte to hex utility since we don't need actual conversion in tests
vi.mock('@noble/hashes/utils', async importOriginal => {
    const actual = (await importOriginal()) as NonNullable<unknown>;
    return {
        ...actual,
        bytesToHex: (data: Uint8Array) => `0x${Buffer.from(data).toString('hex')}`,
    };
});

describe('useFormatAnchorIdl from formatted source for compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq-idl', () => {
    it('should handle constants with invalid JSON', () => {
        const programId = 'compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq';

        const formattedIdl = getFormattedIdl(formatDisplayIdl, anchorLegacyAccountComp, programId);
        const { result } = renderHook(() => useFormatAnchorIdl(formattedIdl));

        const constants = result.current?.constants;
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
