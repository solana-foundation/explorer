import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AccountDownloadDropdown } from '../AccountDownloadDropdown';

const mockMutate = vi.fn();
const mockRawData: Buffer | null = null;
let mockIsLoading = false;

vi.mock('@entities/account', () => ({
    useRawAccountData: () => ({ data: mockRawData, mutate: mockMutate, isLoading: mockIsLoading }),
}));

vi.mock('@/app/shared/components/DownloadDropdown', () => ({
    DownloadDropdown: ({
        filename,
        loading,
        onOpenChange,
    }: {
        filename: string;
        loading?: boolean;
        onOpenChange?: (open: boolean) => void;
    }) => (
        <div data-testid="download-dropdown" data-filename={filename} data-loading={String(loading ?? false)}>
            <button onClick={() => onOpenChange?.(true)}>Download</button>
        </div>
    ),
}));

const PUBKEY = PublicKey.default;

describe('AccountDownloadDropdown', () => {
    it('should render nothing when space is 0', () => {
        const { container } = render(<AccountDownloadDropdown pubkey={PUBKEY} space={0} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('should render the download dropdown', () => {
        render(<AccountDownloadDropdown pubkey={PUBKEY} space={100} />);
        expect(screen.getByTestId('download-dropdown')).toBeInTheDocument();
    });

    it('should pass the pubkey base58 as filename', () => {
        render(<AccountDownloadDropdown pubkey={PUBKEY} />);
        expect(screen.getByTestId('download-dropdown')).toHaveAttribute('data-filename', PUBKEY.toBase58());
    });

    it('should fetch raw data when dropdown opens', () => {
        render(<AccountDownloadDropdown pubkey={PUBKEY} />);
        screen.getByText('Download').click();
        expect(mockMutate).toHaveBeenCalled();
    });

    it('should pass loading state to the download dropdown', () => {
        mockIsLoading = true;
        render(<AccountDownloadDropdown pubkey={PUBKEY} />);
        expect(screen.getByTestId('download-dropdown')).toHaveAttribute('data-loading', 'true');
        mockIsLoading = false;
    });
});
