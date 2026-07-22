// MARKETS is imported here only to pin the hardcoded ID list; runtime detection must stay free of @project-serum/serum.
import { MARKETS } from '@project-serum/serum';
import { describe, expect, it } from 'vitest';

import {
    DEPRECATED_SERUM_PROGRAM_IDS,
    OPEN_BOOK_PROGRAM_IDS,
    OPENBOOK_DEX_PROGRAM_LABEL,
    SERUM_DEX_V1_PROGRAM_IDS,
    SERUM_DEX_V1_PROGRAM_LABEL,
    SERUM_DEX_V1B_PROGRAM_IDS,
    SERUM_DEX_V2_PROGRAM_IDS,
    SERUM_DEX_V2_PROGRAM_LABEL,
    SERUM_DEX_V3_PROGRAM_IDS,
    SERUM_DEX_V3_PROGRAM_LABEL,
    SERUM_PROGRAM_IDS,
} from '../program-ids';

describe('serum program ids', () => {
    it('should pin the canonical OpenBook program id', () => {
        expect(OPEN_BOOK_PROGRAM_IDS).toEqual({ mainnet: 'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX' });
    });

    it('should pin the historical Serum DEX program ids', () => {
        expect(SERUM_DEX_V1_PROGRAM_IDS).toEqual({ mainnet: '4ckmDgGdxQoPDLUkDT3vHgSAkzA3QRdNq5ywwY4sUSJn' });
        expect(SERUM_DEX_V1B_PROGRAM_IDS).toEqual({ mainnet: 'BJ3jrUzddfuSrZHXSCxMUUQsjKEyLmuuyZebkcaFp2fg' });
        expect(SERUM_DEX_V2_PROGRAM_IDS).toEqual({ mainnet: 'EUqojwWA2rd19FZrzeBncJsm38Jm1hEhE3zsmX3bRc2o' });
        expect(SERUM_DEX_V3_PROGRAM_IDS).toEqual({ mainnet: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin' });
    });

    it('should list every serum deployment except OpenBook as deprecated', () => {
        expect(DEPRECATED_SERUM_PROGRAM_IDS).toEqual([
            SERUM_DEX_V1_PROGRAM_IDS.mainnet,
            SERUM_DEX_V1B_PROGRAM_IDS.mainnet,
            SERUM_DEX_V2_PROGRAM_IDS.mainnet,
            SERUM_DEX_V3_PROGRAM_IDS.mainnet,
        ]);
        expect(DEPRECATED_SERUM_PROGRAM_IDS).not.toContain(OPEN_BOOK_PROGRAM_IDS.mainnet);
    });

    it('should include OpenBook in the full program id list', () => {
        expect(SERUM_PROGRAM_IDS).toEqual([...DEPRECATED_SERUM_PROGRAM_IDS, OPEN_BOOK_PROGRAM_IDS.mainnet]);
    });

    it('should cover every program id referenced by the MARKETS registry', () => {
        const marketProgramIds = new Set(
            MARKETS.flatMap(market => (market.programId ? [market.programId.toBase58()] : [])),
        );
        expect(marketProgramIds.size).toBeGreaterThan(0);
        for (const programId of marketProgramIds) {
            expect(DEPRECATED_SERUM_PROGRAM_IDS).toContain(programId);
        }
    });
});

describe('serum program labels', () => {
    it('should pin the registry display names', () => {
        expect(OPENBOOK_DEX_PROGRAM_LABEL).toBe('OpenBook Dex');
        expect(SERUM_DEX_V1_PROGRAM_LABEL).toBe('Serum Dex v1 (deprecated)');
        expect(SERUM_DEX_V2_PROGRAM_LABEL).toBe('Serum Dex v2 (deprecated)');
        expect(SERUM_DEX_V3_PROGRAM_LABEL).toBe('Serum Dex v3 (deprecated)');
    });
});
