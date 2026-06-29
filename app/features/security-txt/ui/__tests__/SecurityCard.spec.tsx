/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { UpgradeableLoaderAccountData } from '@/app/providers/accounts';

import { SecurityCard } from '../SecurityCard';
import { createNeodymeSecurityTxt, createPmpSecurityTxt, programDataFixture } from './helpers';

const mocks = vi.hoisted(() => ({ useSecurityTxt: vi.fn() }));
vi.mock('../../model/useSecurityTxt', () => ({ useSecurityTxt: mocks.useSecurityTxt }));

const mockPubkey = new PublicKey('ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S');
const withData = { programData: programDataFixture } as UpgradeableLoaderAccountData;

describe('SecurityCard', () => {
    beforeEach(() => mocks.useSecurityTxt.mockReturnValue({ isLoading: false, securityTxt: undefined }));
    afterEach(() => vi.clearAllMocks());

    it('should show an error when the account has no program data', () => {
        render(<SecurityCard data={{ programData: undefined } as UpgradeableLoaderAccountData} pubkey={mockPubkey} />);
        expect(screen.getByText(/Account has no data/i)).toBeInTheDocument();
    });

    it("should show the empty card when there's no security.txt", () => {
        render(<SecurityCard data={withData} pubkey={mockPubkey} />);
        expect(screen.getByText(/Program has no security\.txt/i)).toBeInTheDocument();
    });

    it('should render the Neodyme (ELF) table', () => {
        mocks.useSecurityTxt.mockReturnValue({
            isLoading: false,
            securityTxt: createNeodymeSecurityTxt({ name: 'NeodymeSecurityTXT' }),
        });
        render(<SecurityCard data={withData} pubkey={mockPubkey} />);
        expect(screen.getByTestId('security-txt-version-badge')).toHaveTextContent(/Neodyme/i);
        expect(screen.getByText('NeodymeSecurityTXT')).toBeInTheDocument();
        expect(screen.getByText(/Download/i)).toBeInTheDocument();
    });

    it('should render the Program Metadata (PMP) table', () => {
        mocks.useSecurityTxt.mockReturnValue({
            isLoading: false,
            securityTxt: createPmpSecurityTxt({ name: 'ProgramMetadataSecurityTXT' }),
        });
        render(<SecurityCard data={withData} pubkey={mockPubkey} />);
        expect(screen.getByTestId('security-txt-version-badge')).toHaveTextContent(/Program Metadata/i);
        expect(screen.getByText('ProgramMetadataSecurityTXT')).toBeInTheDocument();
    });
});
