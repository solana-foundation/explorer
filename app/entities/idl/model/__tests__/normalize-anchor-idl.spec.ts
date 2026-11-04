import type { RootNode } from 'codama';
import { describe, expect, it } from 'vitest';

import type { CodamaIdl } from '../../lib/types';
import anchor029Devi from '../../mocks/anchor/anchor-0.29.0-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchor030Devi from '../../mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchorLegacy094ShankWave from '../../mocks/anchor/anchor-legacy-0.9.4-shank-waveQX2yP3H1pVU8djGvEHmYg8uamQ84AuyGtpsrXTF.json';
import accountCompression from '../../mocks/anchor/anchor-legacy-account_compression-compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq.json';
import reference029 from '../../mocks/anchor/reference-0.29.json';
import { getIdlSpecType } from '../idl-spec';
import { normalizeAnchorIdl } from '../normalize-anchor-idl';

const PROGRAM_ADDRESS = 'devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH';

describe('normalizeAnchorIdl', () => {
    describe('legacy Anchor IDLs → Codama root nodes', () => {
        it('should convert a legacy shank IDL and preserve tuple types the old reference converter rejected', () => {
            const root = normalizeAnchorIdl(anchorLegacy094ShankWave, PROGRAM_ADDRESS) as RootNode | undefined;

            expect(root).toBeDefined();
            expect(getIdlSpecType(root)).toBe('codama');
            expect(root?.kind).toBe('rootNode');
            // the legacy IDL carried its own address
            expect(root?.program.publicKey).toBe('waveQX2yP3H1pVU8djGvEHmYg8uamQ84AuyGtpsrXTF');
            // every instruction survives the conversion
            expect(root?.program.instructions).toHaveLength(anchorLegacy094ShankWave.instructions.length);

            // The old @solana-developers/helpers reference threw on `{tuple: [...]}`; the Codama path keeps
            // tuples as real `tupleTypeNode`s. `TokenMetadata` (camelCased by the converter) carries a
            // `vec<tuple[string, string]>`.
            const tokenMetadata = root?.program.definedTypes?.find(type => type.name === 'tokenMetadata');
            expect(tokenMetadata).toBeDefined();
            expect(JSON.stringify(tokenMetadata)).toContain('tupleTypeNode');
        });

        it('should convert a legacy 0.29 Anchor IDL (amm_v3)', () => {
            const root = normalizeAnchorIdl(anchor029Devi, PROGRAM_ADDRESS) as RootNode | undefined;

            expect(getIdlSpecType(root)).toBe('codama');
            expect(root?.program.publicKey).toBe(PROGRAM_ADDRESS);
            expect(root?.program.instructions).toHaveLength(anchor029Devi.instructions.length);
        });

        it('should inject the program address when the legacy IDL carries no metadata.address', () => {
            // reference-0.29.json has neither a top-level `address` nor `metadata.address`.
            expect('metadata' in reference029).toBe(false);

            const root = normalizeAnchorIdl(reference029, PROGRAM_ADDRESS) as RootNode | undefined;

            expect(getIdlSpecType(root)).toBe('codama');
            expect(root?.program.publicKey).toBe(PROGRAM_ADDRESS);
        });

        it('should convert account_compression (13 ix, 9 accounts) and preserve its 16 constants Codama drops', () => {
            const root = normalizeAnchorIdl(accountCompression, PROGRAM_ADDRESS) as CodamaIdl | undefined;

            expect(getIdlSpecType(root)).toBe('codama');
            expect(root?.program.instructions).toHaveLength(accountCompression.instructions.length);
            expect(root?.program.accounts).toHaveLength(accountCompression.accounts.length);

            expect(root?.legacyConstants).toHaveLength(accountCompression.constants.length);
            expect(root?.legacyConstants?.[15].name).toBe('NOOP_PUBKEY');
        });

        it('should omit legacyConstants when the legacy IDL defines none', () => {
            const root = normalizeAnchorIdl(anchorLegacy094ShankWave, PROGRAM_ADDRESS) as CodamaIdl | undefined;
            expect(root?.legacyConstants).toBeUndefined();
        });

        it('should preserve the 11 inline-field events Codama drops (amm_v3)', () => {
            const root = normalizeAnchorIdl(anchor029Devi, PROGRAM_ADDRESS) as CodamaIdl | undefined;

            // Codama's rootNodeFromAnchor drops pre-0.30 events entirely — they survive only on legacyEvents.
            expect(JSON.stringify(root?.program.definedTypes)).not.toContain('swapEvent');
            expect(root?.legacyEvents).toHaveLength(anchor029Devi.events.length);
            expect(root?.legacyEvents?.map(event => event.name)).toContain('SwapEvent');
        });

        it('should omit legacyEvents when the legacy IDL defines none', () => {
            const root = normalizeAnchorIdl(accountCompression, PROGRAM_ADDRESS) as CodamaIdl | undefined;
            expect(root?.legacyEvents).toBeUndefined();
        });

        it('should return undefined when conversion fails', () => {
            const broken = {
                instructions: [{ accounts: [], args: [{ name: 'x', type: 'not-a-real-type' }], name: 'boom' }],
                name: 'broken',
                version: '0.1.0',
            };
            expect(normalizeAnchorIdl(broken, PROGRAM_ADDRESS)).toBeUndefined();
        });
    });

    describe('pass-through', () => {
        it('should return a modern Anchor IDL untouched', () => {
            expect(getIdlSpecType(anchor030Devi)).toBe('0.1.0');
            expect(normalizeAnchorIdl(anchor030Devi, PROGRAM_ADDRESS)).toBe(anchor030Devi);
        });

        it('should return a Codama IDL untouched', () => {
            const codamaIdl = { program: { publicKey: PROGRAM_ADDRESS }, standard: 'codama' };
            expect(normalizeAnchorIdl(codamaIdl, PROGRAM_ADDRESS)).toBe(codamaIdl);
        });

        it('should return undefined for a nil IDL', () => {
            expect(normalizeAnchorIdl(undefined, PROGRAM_ADDRESS)).toBeUndefined();
        });
    });
});
