import { PublicKey } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { findGroupConfig, mangoGroups } from '../config';
import { MANGO_PROGRAM_IDS } from './fixtures';

describe('mangoGroups', () => {
    it('should not include mainnet.0', () => {
        expect(mangoGroups.every(g => g.name !== 'mainnet.0')).toBe(true);
    });

    it('should include mainnet.1', () => {
        expect(mangoGroups.some(g => g.name === 'mainnet.1')).toBe(true);
    });

    it.each(['mainnet', 'devnet', 'testnet'] as const)(
        'should contain a group with the %s program ID',
        (network) => {
            const id = MANGO_PROGRAM_IDS[network].toBase58();
            expect(mangoGroups.some(g => g.mangoProgramId.toBase58() === id)).toBe(true);
        }
    );
});

describe('findGroupConfig', () => {
    it.each(['mainnet', 'devnet', 'testnet'] as const)(
        'should return a group config for %s program ID',
        (network) => {
            const result = findGroupConfig(MANGO_PROGRAM_IDS[network]);
            expect(result).toBeDefined();
            expect(result!.mangoProgramId.equals(MANGO_PROGRAM_IDS[network])).toBe(true);
        }
    );

    it('should return undefined for an unknown program ID', () => {
        expect(findGroupConfig(PublicKey.default)).toBeUndefined();
    });
});
