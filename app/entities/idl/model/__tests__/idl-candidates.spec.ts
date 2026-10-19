import { describe, expect, it } from 'vitest';

import { type ProgramIdlPair } from '../../api/types';
import { type SupportedIdl } from '../../lib/types';
import {
    getFirstAnchorIdl,
    getFirstAnchorIdlWithAccounts,
    getOnChainAnchorIdl,
    getOnChainCandidates,
    type SourcedIdl,
} from '../idl-candidates';

const PMP_IDL = { name: 'pmp' } as unknown as SupportedIdl;
const ANCHOR_IDL = { name: 'anchor' } as unknown as SupportedIdl;
const CODAMA_IDL = { kind: 'rootNode', standard: 'codama' } as unknown as SupportedIdl;

const NONE = pair({});
const PMP_ONLY = pair({ programMetadataIdl: PMP_IDL, programMetadataIdlAddress: 'pmp-account' });
const ANCHOR_ONLY = pair({ anchorIdl: ANCHOR_IDL, anchorIdlAddress: 'anchor-account' });
const BOTH = pair({
    anchorIdl: ANCHOR_IDL,
    anchorIdlAddress: 'anchor-account',
    programMetadataIdl: PMP_IDL,
    programMetadataIdlAddress: 'pmp-account',
});

describe('getOnChainCandidates', () => {
    it.each([
        ['no on-chain IDL', NONE, []],
        ['a PMP IDL only', PMP_ONLY, ['programMetadata']],
        ['an Anchor IDL only', ANCHOR_ONLY, ['anchor']],
        ['both on-chain IDLs', BOTH, ['programMetadata', 'anchor']],
    ])('should list the PMP IDL before the Anchor IDL account, for %s', (_, onChain, sources) => {
        expect(sourcesOf(getOnChainCandidates(onChain))).toEqual(sources);
    });

    it('should tag each IDL with its standard and the account it was read from', () => {
        const onChain = pair({
            anchorIdl: ANCHOR_IDL,
            anchorIdlAddress: 'anchor-account',
            programMetadataIdl: CODAMA_IDL,
            programMetadataIdlAddress: 'pmp-account',
        });

        expect(getOnChainCandidates(onChain)).toEqual([
            { address: 'pmp-account', idl: CODAMA_IDL, source: 'programMetadata', standard: 'Codama' },
            { address: 'anchor-account', idl: ANCHOR_IDL, source: 'anchor', standard: 'Anchor' },
        ]);
    });
});

describe('getFirstAnchorIdl', () => {
    it('should skip a Codama candidate', () => {
        const candidates = getOnChainCandidates(pair({ anchorIdl: ANCHOR_IDL, programMetadataIdl: CODAMA_IDL }));

        expect(getFirstAnchorIdl(candidates)).toBe(ANCHOR_IDL);
    });

    it('should take an Anchor-standard PMP IDL before the Anchor IDL account', () => {
        expect(getFirstAnchorIdl(getOnChainCandidates(BOTH))).toBe(PMP_IDL);
    });

    it('should return undefined when no candidate is Anchor-standard', () => {
        expect(getFirstAnchorIdl(getOnChainCandidates(pair({ programMetadataIdl: CODAMA_IDL })))).toBeUndefined();
    });
});

describe('getFirstAnchorIdlWithAccounts', () => {
    it('should skip an Anchor IDL that declares no account type', () => {
        const withAccounts = { accounts: [{ name: 'State' }], name: 'anchor' } as unknown as SupportedIdl;
        const candidates = getOnChainCandidates(
            pair({
                anchorIdl: withAccounts,
                programMetadataIdl: { accounts: [], name: 'pmp' } as unknown as SupportedIdl,
            }),
        );

        expect(getFirstAnchorIdlWithAccounts(candidates)).toBe(withAccounts);
    });
});

describe('getOnChainAnchorIdl', () => {
    it('should return the Anchor IDL account and ignore the PMP IDL', () => {
        expect(getOnChainAnchorIdl(BOTH)).toBe(ANCHOR_IDL);
    });

    it('should return undefined when the Anchor IDL account holds a Codama IDL', () => {
        expect(getOnChainAnchorIdl(pair({ anchorIdl: CODAMA_IDL }))).toBeUndefined();
    });
});

function pair(idls: Partial<ProgramIdlPair>): ProgramIdlPair {
    return {
        anchorIdl: undefined,
        anchorIdlAddress: undefined,
        programMetadataIdl: undefined,
        programMetadataIdlAddress: undefined,
        ...idls,
    };
}

function sourcesOf(candidates: readonly SourcedIdl[]): SourcedIdl['source'][] {
    return candidates.map(candidate => candidate.source);
}
