import codamaIdl from '@entities/idl/mocks/codama/codama-1.0.0-ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S.json';
import { describe, expect, it } from 'vitest';

import { type ProgramIdlPair } from '../../api/types';
import { type SupportedIdl } from '../../lib/types';
import {
    getAnchorAccountIdls,
    getAnchorIdls,
    getAnchorIdlsWithAccounts,
    getOnChainCandidates,
    type SourcedIdl,
} from '../idl-candidates';
import { IdlVariant } from '../idl-variant';

const PMP_IDL = { name: 'pmp' } as unknown as SupportedIdl;
const ANCHOR_IDL = { name: 'anchor' } as unknown as SupportedIdl;
const CODAMA_IDL = codamaIdl as unknown as SupportedIdl;

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
        ['a PMP IDL only', PMP_ONLY, [IdlVariant.ProgramMetadata]],
        ['an Anchor IDL only', ANCHOR_ONLY, [IdlVariant.Anchor]],
    ])('should list the sources when the program has %s', (_, onChain, sources) => {
        expect(sourcesOf(getOnChainCandidates(onChain))).toEqual(sources);
    });

    it('should list the PMP IDL before the Anchor IDL account', () => {
        expect(sourcesOf(getOnChainCandidates(BOTH))).toEqual([IdlVariant.ProgramMetadata, IdlVariant.Anchor]);
    });

    it('should tag each IDL with its standard and the account it was read from', () => {
        const onChain = pair({
            anchorIdl: ANCHOR_IDL,
            anchorIdlAddress: 'anchor-account',
            programMetadataIdl: CODAMA_IDL,
            programMetadataIdlAddress: 'pmp-account',
        });

        expect(getOnChainCandidates(onChain)).toEqual([
            { idl: CODAMA_IDL, idlAddress: 'pmp-account', source: IdlVariant.ProgramMetadata, standard: 'Codama' },
            { idl: ANCHOR_IDL, idlAddress: 'anchor-account', source: IdlVariant.Anchor, standard: 'Anchor' },
        ]);
    });
});

describe('getAnchorIdls', () => {
    it('should skip a Codama candidate', () => {
        const candidates = getOnChainCandidates(pair({ anchorIdl: ANCHOR_IDL, programMetadataIdl: CODAMA_IDL }));

        expect(getAnchorIdls(candidates)).toEqual([ANCHOR_IDL]);
    });

    it('should list an Anchor-standard PMP IDL before the Anchor IDL account', () => {
        expect(getAnchorIdls(getOnChainCandidates(BOTH))).toEqual([PMP_IDL, ANCHOR_IDL]);
    });

    it('should return no IDLs when no candidate is Anchor-standard', () => {
        expect(getAnchorIdls(getOnChainCandidates(pair({ programMetadataIdl: CODAMA_IDL })))).toEqual([]);
    });
});

describe('getAnchorIdlsWithAccounts', () => {
    it('should skip an Anchor IDL that declares no account types', () => {
        const withAccounts = { accounts: [{ name: 'State' }], name: 'anchor' } as unknown as SupportedIdl;
        const candidates = getOnChainCandidates(
            pair({
                anchorIdl: withAccounts,
                programMetadataIdl: { accounts: [], name: 'pmp' } as unknown as SupportedIdl,
            }),
        );

        expect(getAnchorIdlsWithAccounts(candidates)).toEqual([withAccounts]);
    });
});

describe('getAnchorAccountIdls', () => {
    it('should return the IDL from the Anchor IDL account and ignore the PMP IDL', () => {
        expect(getAnchorAccountIdls(getOnChainCandidates(BOTH))).toEqual([ANCHOR_IDL]);
    });

    it('should return no IDLs when the Anchor IDL account holds a Codama IDL', () => {
        expect(getAnchorAccountIdls(getOnChainCandidates(pair({ anchorIdl: CODAMA_IDL })))).toEqual([]);
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
