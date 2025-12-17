import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { useProgramMetadataSecurityTxt } from '@/app/entities/program-metadata';
import { useCluster } from '@/app/providers/cluster';
import { Cluster } from '@/app/utils/cluster';

import { NEODYME_SECURITY_TXT_DOC_LINK, PMP_SECURITY_TXT_DOC_LINK } from '../../lib/constants';
import { ProgramSecurityTXTLabel } from '../SecurityTXTLabel';

vi.mock('@/app/providers/cluster', () => ({
    useCluster: vi.fn(),
}));

vi.mock('@/app/entities/program-metadata', () => ({
    useProgramMetadataSecurityTxt: vi.fn(),
}));

const mockPubkey = new PublicKey('ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S');

describe('ProgramSecurityTXTLabel (mocked useProgramMetadataSecurityTxt)', () => {
    beforeEach(() => {
        (useCluster as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ cluster: Cluster.MainnetBeta });
    });
    afterEach(() => vi.clearAllMocks());

    it('should show Neodyme link to security.txt by default', () => {
        (useProgramMetadataSecurityTxt as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            programMetadataSecurityTxt: null,
        });
        render(<ProgramSecurityTXTLabel programPubkey={mockPubkey} />);
        expect(screen.getByRole('link')).toHaveAttribute('href', NEODYME_SECURITY_TXT_DOC_LINK);
    });

    it('should show Program Metadata link to security.txt', () => {
        (useProgramMetadataSecurityTxt as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            programMetadataSecurityTxt: { name: 'Program security.txt' },
        });
        render(<ProgramSecurityTXTLabel programPubkey={mockPubkey} />);
        expect(screen.getByRole('link')).toHaveAttribute('href', PMP_SECURITY_TXT_DOC_LINK);
    });
});
