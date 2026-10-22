import codamaIdl from '@entities/idl/mocks/codama/codama-1.0.0-ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S.json';
import { describe, expect, it } from 'vitest';

import { type ProgramIdlPair } from '../../api/types';
import { type SupportedIdl } from '../../lib/types';
import { IdlVariant } from '../idl-variant';
import {
    getAnchorAccountIdls,
    getAnchorIdls,
    getAnchorIdlsWithAccounts,
    getOnChainIdls,
    type SourcedIdl,
} from '../sourced-idl';

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

describe('getOnChainIdls', () => {
    it.each([
        ['no on-chain IDL', NONE, []],
        ['a PMP IDL only', PMP_ONLY, [IdlVariant.ProgramMetadata]],
        ['an Anchor IDL only', ANCHOR_ONLY, [IdlVariant.Anchor]],
    ])('should list the sources when the program has %s', (_, onChain, sources) => {
        expect(sourcesOf(getOnChainIdls(onChain))).toEqual(sources);
    });

    it('should list the PMP IDL before the Anchor IDL account', () => {
        expect(sourcesOf(getOnChainIdls(BOTH))).toEqual([IdlVariant.ProgramMetadata, IdlVariant.Anchor]);
    });

    it('should tag a Kinobi root as Codama', () => {
        const kinobiIdl = { ...codamaIdl, standard: 'kinobi' } as unknown as SupportedIdl;

        expect(getOnChainIdls(pair({ programMetadataIdl: kinobiIdl }))[0].standard).toBe('Codama');
    });

    it('should tag each IDL with its standard and the account it was read from', () => {
        const onChain = pair({
            anchorIdl: ANCHOR_IDL,
            anchorIdlAddress: 'anchor-account',
            programMetadataIdl: CODAMA_IDL,
            programMetadataIdlAddress: 'pmp-account',
        });

        expect(getOnChainIdls(onChain)).toEqual([
            { idl: CODAMA_IDL, idlAddress: 'pmp-account', source: IdlVariant.ProgramMetadata, standard: 'Codama' },
            { idl: ANCHOR_IDL, idlAddress: 'anchor-account', source: IdlVariant.Anchor, standard: 'Anchor' },
        ]);
    });
});

describe('getAnchorIdls', () => {
    it('should skip a Codama IDL', () => {
        const idls = getOnChainIdls(pair({ anchorIdl: ANCHOR_IDL, programMetadataIdl: CODAMA_IDL }));

        expect(getAnchorIdls(idls)).toEqual([ANCHOR_IDL]);
    });

    it('should list an Anchor-standard PMP IDL before the Anchor IDL account', () => {
        expect(getAnchorIdls(getOnChainIdls(BOTH))).toEqual([PMP_IDL, ANCHOR_IDL]);
    });

    it('should return no IDLs when no IDL is Anchor-standard', () => {
        expect(getAnchorIdls(getOnChainIdls(pair({ programMetadataIdl: CODAMA_IDL })))).toEqual([]);
    });
});

describe('getAnchorIdlsWithAccounts', () => {
    it('should skip an Anchor IDL that declares no account types', () => {
        const withAccounts = { accounts: [{ name: 'State' }], name: 'anchor' } as unknown as SupportedIdl;
        const idls = getOnChainIdls(
            pair({
                anchorIdl: withAccounts,
                programMetadataIdl: { accounts: [], name: 'pmp' } as unknown as SupportedIdl,
            }),
        );

        expect(getAnchorIdlsWithAccounts(idls)).toEqual([withAccounts]);
    });
});

describe('getAnchorAccountIdls', () => {
    it('should return the IDL from the Anchor IDL account and ignore the PMP IDL', () => {
        expect(getAnchorAccountIdls(getOnChainIdls(BOTH))).toEqual([ANCHOR_IDL]);
    });

    it('should return no IDLs when the Anchor IDL account holds a Codama IDL', () => {
        expect(getAnchorAccountIdls(getOnChainIdls(pair({ anchorIdl: CODAMA_IDL })))).toEqual([]);
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

function sourcesOf(idls: readonly SourcedIdl[]): SourcedIdl['source'][] {
    return idls.map(({ source }) => source);
}
