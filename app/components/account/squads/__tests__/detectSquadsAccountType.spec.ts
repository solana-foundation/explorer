import { PublicKey } from '@solana/web3.js';
import { generated } from '@sqds/multisig';
import { describe, expect, it } from 'vitest';

import { SQUADS_V4_ADDRESS } from '@/app/providers/squadsMultisig';

import { detectSquadsAccountType } from '../SquadsAccountSection';

const SQUADS_OWNER = new PublicKey(SQUADS_V4_ADDRESS);

function withDiscriminator(discriminator: number[]): Uint8Array {
    const data = new Uint8Array(64);
    data.set(discriminator, 0);
    return data;
}

describe('detectSquadsAccountType', () => {
    it('should detect a Batch account', () => {
        expect(detectSquadsAccountType(SQUADS_OWNER, withDiscriminator(generated.batchDiscriminator))).toBe('batch');
    });

    it('should detect a VaultTransaction account', () => {
        expect(detectSquadsAccountType(SQUADS_OWNER, withDiscriminator(generated.vaultTransactionDiscriminator))).toBe(
            'vaultTransaction',
        );
    });

    it('should return undefined when not owned by the Squads v4 program', () => {
        expect(
            detectSquadsAccountType(PublicKey.default, withDiscriminator(generated.batchDiscriminator)),
        ).toBeUndefined();
    });

    it('should return undefined for a non-matching discriminator (e.g. Proposal)', () => {
        expect(
            detectSquadsAccountType(SQUADS_OWNER, withDiscriminator(generated.proposalDiscriminator)),
        ).toBeUndefined();
    });

    it('should return undefined for data shorter than the discriminator', () => {
        expect(detectSquadsAccountType(SQUADS_OWNER, new Uint8Array(4))).toBeUndefined();
    });
});
