import { describe, expect, it } from 'vitest';

import {
    ADDRESS_LOOKUP_TABLE_PROGRAM_ID,
    BPF_LOADER_2_PROGRAM_ID,
    BPF_LOADER_PROGRAM_ID,
    BPF_UPGRADEABLE_LOADER_PROGRAM_ID,
    FEATURE_PROGRAM_ID,
    LOADER_V4_PROGRAM_ID,
    NFTOKEN_ADDRESS,
    SOLANA_ATTESTATION_SERVICE_PROGRAM_ID,
    SQUADS_V3_ADDRESS,
    SQUADS_V4_ADDRESS,
    TOKEN_2022_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
} from '../constants.js';

// On-chain IDs are external invariants — a typo (or a silent change in a client package) misclassifies every account of that kind.
describe('constants', () => {
    it('should pin the client-provided program ids', () => {
        expect(TOKEN_PROGRAM_ID).toBe('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
        expect(TOKEN_2022_PROGRAM_ID).toBe('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
        expect(SOLANA_ATTESTATION_SERVICE_PROGRAM_ID).toBe('22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG');
        expect(BPF_UPGRADEABLE_LOADER_PROGRAM_ID).toBe('BPFLoaderUpgradeab1e11111111111111111111111');
        expect(ADDRESS_LOOKUP_TABLE_PROGRAM_ID).toBe('AddressLookupTab1e1111111111111111111111111');
    });

    it('should pin the literal program ids', () => {
        expect(BPF_LOADER_PROGRAM_ID).toBe('BPFLoader1111111111111111111111111111111111');
        expect(BPF_LOADER_2_PROGRAM_ID).toBe('BPFLoader2111111111111111111111111111111111');
        expect(LOADER_V4_PROGRAM_ID).toBe('LoaderV411111111111111111111111111111111111');
        expect(FEATURE_PROGRAM_ID).toBe('Feature111111111111111111111111111111111111');
        expect(NFTOKEN_ADDRESS).toBe('nftokf9qcHSYkVSP3P2gUMmV6d4AwjMueXgUu43HyLL');
        expect(SQUADS_V3_ADDRESS).toBe('SMPLecH534NA9acpos4G6x7uf3LWbCAwZQE9e8ZekMu');
        expect(SQUADS_V4_ADDRESS).toBe('SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf');
    });
});
