import type { IdlConst } from '@coral-xyz/anchor/dist/cjs/idl';
import accountCompressionIdl from '@entities/idl/mocks/anchor/anchor-legacy-account_compression-compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq.json';
import { describe, expect, it } from 'vitest';

import { formatConstants } from '../format-constants';

const constants = accountCompressionIdl.constants as unknown as IdlConst[];

function valueOf(name: string) {
    return formatConstants(constants)?.find(constant => constant.name === name)?.value;
}

describe('formatConstants', () => {
    it('should keep a non-JSON numeric value (e.g. "28_807") as the raw string', () => {
        expect(valueOf('ADDRESS_QUEUE_VALUES')).toBe('28_807');
        expect(valueOf('STATE_NULLIFIER_QUEUE_VALUES')).toBe('28_807');
    });

    it('should keep a malformed pubkey array (trailing comma) as the raw string', () => {
        const noopPubkey = constants.find(constant => constant.name === 'NOOP_PUBKEY')?.value;
        expect(valueOf('NOOP_PUBKEY')).toBe(noopPubkey);
    });

    it('should parse a valid-JSON numeric value into a number', () => {
        expect(valueOf('STATE_MERKLE_TREE_HEIGHT')).toBe(26);
    });

    it('should return undefined when there are no constants', () => {
        expect(formatConstants(undefined)).toBeUndefined();
    });
});
