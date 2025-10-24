import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { useProgramMetadataSecurityTxt } from '@/app/entities/program-metadata';
import type { UpgradeableLoaderAccountData } from '@/app/providers/accounts';
import { useCluster } from '@/app/providers/cluster';
import { Cluster } from '@/app/utils/cluster';

import { SecurityCard } from '../SecurityCard';
import { programDataWithoutSecurityTxt, programDataWithSecurityTxt } from './helpers';

vi.mock('@/app/providers/cluster', () => ({
    useCluster: vi.fn(),
}));

vi.mock('@/app/entities/program-metadata', () => ({
    useProgramMetadataSecurityTxt: vi.fn(),
}));

const mockPubkey = new PublicKey('ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S');

function mockAccountData(programData: UpgradeableLoaderAccountData['programData']) {
    return {
        programData,
    } as UpgradeableLoaderAccountData;
}

describe('SecurityCard (mocked useProgramMetadataSecurityTxt)', () => {
    beforeEach(() => {
        (useCluster as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ cluster: Cluster.MainnetBeta });
    });
    afterEach(() => vi.clearAllMocks());

    it("should show error when account doesn't have programData", () => {
        (useProgramMetadataSecurityTxt as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            programMetadataSecurityTxt: null,
        });
        render(<SecurityCard data={mockAccountData(undefined)} pubkey={mockPubkey} />);
        expect(screen.getByText(/Account has no data/i)).toBeInTheDocument();
    });

    it("should show error when account doesn't have any security.txt", async () => {
        (useProgramMetadataSecurityTxt as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            programMetadataSecurityTxt: null,
        });
        vi.spyOn(await import('../../lib/fromProgramData'), 'fromProgramData').mockReturnValueOnce({
            error: undefined,
            securityTXT: undefined,
        });
        render(<SecurityCard data={mockAccountData(programDataWithoutSecurityTxt)} pubkey={mockPubkey} />);
        expect(screen.getByText(/Program has no security\.txt/i)).toBeInTheDocument();
        expect(screen.getByText(/program did not provide Security\.txt information/i)).toBeInTheDocument();
    });

    it('should show Neodyme security.txt', () => {
        (useProgramMetadataSecurityTxt as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            programMetadataSecurityTxt: null,
        });
        render(<SecurityCard data={mockAccountData(programDataWithSecurityTxt)} pubkey={mockPubkey} />);
        expect(screen.getByTestId('security-txt-version-badge')).toHaveTextContent(/Neodyme/i);
        expect(screen.getByText('NeodymeSecurityTXT')).toBeInTheDocument();
        expect(screen.getByText(/Download/i)).toBeInTheDocument();
        expect(screen.queryByText('ProgramMetadataSecurityTXT')).not.toBeInTheDocument();
    });

    it('should show Program Metadata security.txt', () => {
        const data = { name: 'ProgramMetadataSecurityTXT' };
        (useProgramMetadataSecurityTxt as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            programMetadataSecurityTxt: data,
        });
        render(<SecurityCard data={mockAccountData(programDataWithSecurityTxt)} pubkey={mockPubkey} />);
        expect(screen.getByTestId('security-txt-version-badge')).toHaveTextContent(/Program Metadata/i);
        expect(screen.getByText('ProgramMetadataSecurityTXT')).toBeInTheDocument();
        expect(screen.getByText(/Download/i)).toBeInTheDocument();
        expect(screen.queryByText('NeodymeSecurityTXT')).not.toBeInTheDocument();
    });
});
