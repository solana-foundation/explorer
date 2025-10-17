import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useProgramMetadataSecurityTxt } from '@/app/entities/program-metadata';
import {
    createNeodymeSecurityTxtWithOptionalFields,
    createPmpSecurityTxt,
} from '@/app/features/security-txt/ui/__tests__/helpers';

import { fromProgramData } from '../../lib/fromProgramData';
import { useSecurityTxt } from '../useSecurityTxt';

vi.mock('@/app/providers/cluster', () => ({
    useCluster: vi.fn(() => ({
        cluster: 'mainnet-beta',
        url: 'https://api.mainnet-beta.solana.com',
    })),
}));

vi.mock('@/app/entities/program-metadata', () => ({
    useProgramMetadataSecurityTxt: vi.fn(() => ({
        programMetadataSecurityTxt: null,
    })),
}));

vi.mock('../../lib/fromProgramData', () => ({
    fromProgramData: vi.fn(() => ({
        securityTXT: undefined,
    })),
}));

describe('useSecurityTxt', () => {
    it('should return undefined when no security TXT is available', () => {
        const { result } = setup();

        expect(result.current).toBeUndefined();
    });

    it('should return security TXT from program data when available', () => {
        const neodymeSecurityTxt = createNeodymeSecurityTxtWithOptionalFields();
        vi.mocked(fromProgramData).mockReturnValueOnce({
            securityTXT: neodymeSecurityTxt,
        });

        const { result } = setup();

        expect(result.current).toEqual(neodymeSecurityTxt);
    });

    it('should return security TXT from program metadata when both are available', () => {
        const pmpSecurityTxt = createPmpSecurityTxt();
        const neodymeSecurityTxt = createNeodymeSecurityTxtWithOptionalFields();

        vi.mocked(useProgramMetadataSecurityTxt).mockReturnValueOnce({
            programMetadataSecurityTxt: pmpSecurityTxt,
        });
        vi.mocked(fromProgramData).mockReturnValueOnce({
            securityTXT: neodymeSecurityTxt,
        });

        const { result } = setup();
        expect(result.current).toEqual(pmpSecurityTxt);
    });
});

function setup() {
    const address = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';
    const programData = {
        authority: null,
        data: ['base64data', 'base64'] as [string, 'base64'],
        slot: 123456,
    };
    const utils = renderHook(() => useSecurityTxt(address, { programData }));
    return { ...utils };
}
