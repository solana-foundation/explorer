import { parseAccountData } from '@codama/dynamic-parsers';
import { describe, expect, it, vi } from 'vitest';

import { decodeAccountWithIdl } from '../decode-account';
import { IDL_ERROR__ACCOUNT_DECODE_FAILED, IDL_ERROR__IDL_PARSE_FAILED } from '../../errors';
import { type AnchorIdl, IdlStandard } from '../../types';
import { loadSimpleIdl, loadTokenkegIdl } from '../../__tests__/fixtures';

vi.mock('@codama/dynamic-parsers', () => ({
    parseAccountData: vi.fn(),
}));

const brokenAnchorIdl = () =>
    ({
        address: '11111111111111111111111111111111',
        instructions: [{ accounts: [], args: [{ name: 'x', type: 'not-a-type' }], discriminator: [9], name: 'boom' }],
        metadata: { name: 'broken', spec: '0.1.0', version: '0.0.1' },
    }) as unknown as AnchorIdl;

describe('decodeAccountWithIdl', () => {
    // runs first, so the mock is fresh — asserts the success arm wires the resolved root + data through
    it('should decode via parseAccountData, passing the resolved root and raw data', () => {
        const parsed = { data: { m: 1 }, path: [] };
        vi.mocked(parseAccountData).mockReturnValue(parsed as unknown as ReturnType<typeof parseAccountData>);

        const tokenkeg = loadTokenkegIdl();
        const data = Uint8Array.from([1, 2, 3]);
        const decode = decodeAccountWithIdl(tokenkeg, data);

        if (decode.kind !== IdlStandard.Codama) throw new Error('expected the codama arm');
        expect(parseAccountData).toHaveBeenCalledExactlyOnceWith(tokenkeg, data);
        expect(decode.decoded).toBe(parsed);
    });

    it('should return conversion errors for detected-but-unconvertible Anchor IDLs', () => {
        const decode = decodeAccountWithIdl(brokenAnchorIdl(), Uint8Array.from([1, 2, 3]));

        if (decode.kind !== 'unknown') throw new Error('expected the unknown arm');
        expect(decode.errors.map(e => e.code)).toEqual([IDL_ERROR__IDL_PARSE_FAILED]);
    });

    it('should wrap parser throws as account-decode failures', () => {
        const cause = new Error('short account data');
        vi.mocked(parseAccountData).mockImplementation(() => {
            throw cause;
        });

        const data = Uint8Array.from([1, 2, 3]);
        const decode = decodeAccountWithIdl(loadTokenkegIdl(), data);

        if (decode.kind !== 'unknown') throw new Error('expected the unknown arm');
        expect(decode.errors).toHaveLength(1);
        expect(decode.errors[0]).toMatchObject({
            code: IDL_ERROR__ACCOUNT_DECODE_FAILED,
            context: {
                dataLength: data.length,
                standard: IdlStandard.Codama,
            },
        });
        expect(decode.errors[0]?.cause).toBe(cause);
    });
});

describe('decodeAccountWithIdl fallback escape hatch', () => {
    it('should land on the anchor arm when the fallback rescues an unmatched account', () => {
        vi.mocked(parseAccountData).mockReturnValue(undefined);

        const decode = decodeAccountWithIdl(loadSimpleIdl(), Uint8Array.from([1, 2, 3]), {
            fallbackDecoder: { decodeAccount: () => ({ count: 7 }) },
        });

        if (decode.kind !== IdlStandard.Anchor) throw new Error('expected the anchor arm');
        expect(decode.decoded).toEqual({ count: 7 });
        // conversion succeeded, so no bypassed pipeline errors ride along
        expect(decode.recoveredFrom).toBeUndefined();
    });

    it('should keep the bypassed pipeline errors on a rescue of an unconvertible document', () => {
        const decode = decodeAccountWithIdl(brokenAnchorIdl(), Uint8Array.from([1, 2, 3]), {
            fallbackDecoder: { decodeAccount: () => ({ count: 7 }) },
        });

        if (decode.kind !== IdlStandard.Anchor) throw new Error('expected the anchor arm');
        expect(decode.recoveredFrom?.map(e => e.code)).toEqual([IDL_ERROR__IDL_PARSE_FAILED]);
    });

    it('should fall to the unknown arm when the fallback returns undefined', () => {
        vi.mocked(parseAccountData).mockReturnValue(undefined);

        const decode = decodeAccountWithIdl(loadSimpleIdl(), Uint8Array.from([1, 2, 3]), {
            fallbackDecoder: { decodeAccount: () => undefined },
        });

        expect(decode.kind).toBe('unknown');
    });

    it('should fold a throwing fallback into the unknown arm instead of escaping', () => {
        vi.mocked(parseAccountData).mockReturnValue(undefined);

        const decode = decodeAccountWithIdl(loadSimpleIdl(), Uint8Array.from([1, 2, 3]), {
            fallbackDecoder: {
                decodeAccount: () => {
                    throw new Error('decoder boom');
                },
            },
        });

        if (decode.kind !== 'unknown') throw new Error('expected the unknown arm');
        expect(decode.errors.map(e => e.code)).toEqual([IDL_ERROR__ACCOUNT_DECODE_FAILED]);
    });

    it('should never call the fallback for a Codama document', () => {
        vi.mocked(parseAccountData).mockReturnValue(undefined);
        const decodeAccount = vi.fn(() => ({ count: 7 }));

        const decode = decodeAccountWithIdl(loadTokenkegIdl(), Uint8Array.from([1, 2, 3]), {
            fallbackDecoder: { decodeAccount },
        });

        expect(decode.kind).toBe('unknown');
        expect(decodeAccount).not.toHaveBeenCalled();
    });
});
