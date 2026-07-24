// Legacy (spec 00) input at client creation — converted via nodes-from-anchor; the program address
// must resolve (IDL metadata.address → options.programAddress → typed error).
import { address, type Instruction } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { createIdlClient, createIdlMetaClient, tryCreateIdlClient, tryCreateIdlMetaClient } from '../../client';
import { isAnchorIdl, isLegacyAnchorIdl, isSupportedIdl } from '../../detect';
import { IDL_ERROR__IDL_PARSE_FAILED, IDL_ERROR__PROGRAM_ADDRESS_REQUIRED, isIdlError } from '../../errors';
import { IdlStandard } from '../../types';
import {
    loadNtt029Idl,
    loadSimpleIdl,
    loadTokenkegIdl,
    NTT_PROGRAM_ADDRESS,
    NTT_TRANSFER_BURN_DISCRIMINATOR,
    u64le,
} from '../fixtures';

/** A complete transferBurn instruction: TransferArgs{amount 42, chain 1, 32-byte recipient, no queue}. */
const transferBurnIx: Instruction & { accounts: []; data: Uint8Array } = {
    accounts: [],
    data: new Uint8Array([
        ...NTT_TRANSFER_BURN_DISCRIMINATOR,
        ...u64le(42n),
        1,
        0, // recipientChain.id (u16 le)
        ...Array.from({ length: 32 }, () => 7), // recipientAddress
        0, // shouldQueue
    ]),
    programAddress: address(NTT_PROGRAM_ADDRESS),
};

// legacy IDLs from `anchor build` carry no metadata.address — the option supplies it
const withAddress = { programAddress: NTT_PROGRAM_ADDRESS };

describe('isLegacyAnchorIdl', () => {
    it('should recognize a real anchor-0.29 IDL (wormhole NTT) as legacy, not supported', () => {
        const ntt = loadNtt029Idl();
        expect(isLegacyAnchorIdl(ntt)).toBe(true);
        expect(isAnchorIdl(ntt)).toBe(false);
        expect(isSupportedIdl(ntt)).toBe(false);
    });

    it('should reject both supported standards', () => {
        expect(isLegacyAnchorIdl(loadSimpleIdl())).toBe(false);
        expect(isLegacyAnchorIdl(loadTokenkegIdl())).toBe(false);
    });

    it.each([null, undefined, 42, 'idl', {}, []])('should reject non-IDL input %#', value => {
        expect(isLegacyAnchorIdl(value)).toBe(false);
    });
});

describe('createIdlClient over a legacy IDL', () => {
    it('should decode through the internally converted root on the codama arm', () => {
        const client = createIdlClient(loadNtt029Idl(), withAddress);

        const decode = client.decodeInstruction(transferBurnIx);
        expect(decode.kind).toBe(IdlStandard.Codama);
        expect(client.getDecodedData<{ args: { amount: bigint } }>(decode)).toMatchObject({
            args: { amount: 42n, recipientChain: { id: 1 }, shouldQueue: false },
        });
    });

    it('should inject the option address into the converted root', () => {
        const client = createIdlClient(loadNtt029Idl(), withAddress);

        expect(client.programAddress()).toBe(NTT_PROGRAM_ADDRESS);
        expect(client.programName()).toBe('Example Native Token Transfers');
    });

    it('should prefer the address the IDL itself declares', () => {
        const legacy = { ...loadNtt029Idl(), metadata: { address: NTT_PROGRAM_ADDRESS } };
        const client = createIdlClient(legacy); // no option needed — metadata.address survives conversion

        expect(client.programAddress()).toBe(NTT_PROGRAM_ADDRESS);
    });

    it('should throw the typed error when no program address resolves', () => {
        expect(() => createIdlClient(loadNtt029Idl())).toThrowError(
            expect.objectContaining({ code: IDL_ERROR__PROGRAM_ADDRESS_REQUIRED }),
        );
    });

    it('should return the missing-address error through the untrusted route', () => {
        const [error, client] = tryCreateIdlClient(loadNtt029Idl() as unknown);
        expect(client).toBeUndefined();
        expect(error && isIdlError(error, IDL_ERROR__PROGRAM_ADDRESS_REQUIRED)).toBe(true);
        expect(error?.context).toMatchObject({ programName: 'example_native_token_transfers' });
    });

    it('should build a working client through the untrusted route when the option supplies the address', () => {
        const [error, client] = tryCreateIdlClient(loadNtt029Idl() as unknown, withAddress);

        expect(error).toBeUndefined();
        expect(client?.programAddress()).toBe(NTT_PROGRAM_ADDRESS);
        expect(client?.decodeInstruction(transferBurnIx).kind).toBe(IdlStandard.Codama);
    });

    it('should surface a conversion failure as the parse error', () => {
        // legacy-shaped, but declares a type nodes-from-anchor cannot convert
        const broken = {
            instructions: [{ accounts: [], args: [{ name: 'x', type: 'not-a-type' }], name: 'broken' }],
            name: 'broken_program',
            version: '0.0.1',
        };
        const [error, client] = tryCreateIdlClient(broken, withAddress);
        expect(client).toBeUndefined();
        expect(error && isIdlError(error, IDL_ERROR__IDL_PARSE_FAILED)).toBe(true);
    });
});

describe('createIdlMetaClient over a legacy IDL', () => {
    it('should serve names off the converted root — legacy declares no discriminators, the conversion derives them', () => {
        const meta = createIdlMetaClient(loadNtt029Idl(), withAddress);

        expect(meta.programName()).toBe('Example Native Token Transfers');
        expect(meta.programAddress()).toBe(NTT_PROGRAM_ADDRESS);
        // sha256('global:transfer_burn')[..8] — only exists on the converted root
        expect(meta.instructionName(transferBurnIx.data)).toBe('Transfer Burn');
        expect('decodeInstruction' in meta).toBe(false);
    });

    it('should return the missing-address error through the untrusted route', () => {
        const [error, meta] = tryCreateIdlMetaClient(loadNtt029Idl() as unknown);
        expect(meta).toBeUndefined();
        expect(error && isIdlError(error, IDL_ERROR__PROGRAM_ADDRESS_REQUIRED)).toBe(true);
    });

    it('should throw the typed error when no program address resolves', () => {
        expect(() => createIdlMetaClient(loadNtt029Idl())).toThrowError(
            expect.objectContaining({ code: IDL_ERROR__PROGRAM_ADDRESS_REQUIRED }),
        );
    });

    it('should build a meta client through the untrusted route when the option supplies the address', () => {
        const [error, meta] = tryCreateIdlMetaClient(loadNtt029Idl() as unknown, withAddress);

        expect(error).toBeUndefined();
        expect(meta?.programAddress()).toBe(NTT_PROGRAM_ADDRESS);
        expect(meta?.instructionName(transferBurnIx.data)).toBe('Transfer Burn');
    });
});
