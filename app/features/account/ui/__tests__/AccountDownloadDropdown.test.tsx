import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AccountDownloadDropdown } from '../AccountDownloadDropdown';

const mockFetchRaw = vi.fn();
vi.mock('@entities/account', () => ({
    useRawAccountData: () => [null, mockFetchRaw],
}));

vi.mock('@/app/shared/components/DownloadDropdown', () => ({
    DownloadDropdown: ({ filename, onOpenChange }: { filename: string; onOpenChange?: (open: boolean) => void }) => (
        <div data-testid="download-dropdown" data-filename={filename}>
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
        expect(mockFetchRaw).toHaveBeenCalled();
    });
});
