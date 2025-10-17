import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { useProgramMetadataSecurityTxt } from '@/app/entities/program-metadata';
import { useCluster } from '@/app/providers/cluster';
import { Cluster } from '@/app/utils/cluster';

import { ProgramSecurityTXTBadge } from '../SecurityTXTBadge';
import { programDataWithoutSecurityTxt, programDataWithSecurityTxt } from './helpers';

vi.mock('@/app/providers/cluster', () => ({
    useCluster: vi.fn(),
}));

vi.mock('@/app/entities/program-metadata', () => ({
    useProgramMetadataSecurityTxt: vi.fn(),
}));

const invalidProgramData = {
    authority: PublicKey.default,
    data: [''] as unknown as [string, 'base64'],
    slot: 123,
};

const mockPubkey = new PublicKey('ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S');

describe('ProgramSecurityTXTBadge (mocked useProgramMetadataSecurityTxt)', () => {
    beforeEach(() => {
        (useCluster as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ cluster: Cluster.MainnetBeta });
    });
    afterEach(() => vi.clearAllMocks());

    it('should show error when program doesnt have security.txt', () => {
        (useProgramMetadataSecurityTxt as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            programMetadataSecurityTxt: null,
        });
        render(<ProgramSecurityTXTBadge programData={programDataWithoutSecurityTxt} programPubkey={mockPubkey} />);
        expect(screen.getByText(/Program has no security.txt/i)).toBeInTheDocument();
    });

    it('should show error when program has invalid data', () => {
        (useProgramMetadataSecurityTxt as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            programMetadataSecurityTxt: null,
        });
        render(<ProgramSecurityTXTBadge programData={invalidProgramData} programPubkey={mockPubkey} />);
        expect(screen.getByText(/Failed to decode program data/i)).toBeInTheDocument();
    });

    it('should show Included badge when program has only security.txt from Program Metadata', () => {
        (useProgramMetadataSecurityTxt as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            programMetadataSecurityTxt: { name: 'Program security.txt' },
        });
        render(<ProgramSecurityTXTBadge programData={invalidProgramData} programPubkey={mockPubkey} />);
        expect(screen.getByText(/Included/i)).toBeInTheDocument();
    });

    it('should show Included badge when program has only security.txt from Program Data', () => {
        (useProgramMetadataSecurityTxt as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            programMetadataSecurityTxt: undefined,
        });
        render(<ProgramSecurityTXTBadge programData={programDataWithSecurityTxt} programPubkey={mockPubkey} />);
        expect(screen.getByText(/Included/i)).toBeInTheDocument();
    });

    it('should show Included badge when program has both security.txts', () => {
        (useProgramMetadataSecurityTxt as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            programMetadataSecurityTxt: { name: 'Name' },
        });
        render(<ProgramSecurityTXTBadge programData={programDataWithSecurityTxt} programPubkey={mockPubkey} />);
        expect(screen.getByText(/Included/i)).toBeInTheDocument();
    });
});
