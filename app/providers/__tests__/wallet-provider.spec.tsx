import { WalletError } from '@solana/wallet-adapter-base';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { WalletProvider } from '../wallet-provider';

const mockToastCustom = vi.fn();
vi.mock('@shared/ui/sonner/use-toast', () => ({
    useToast: () => ({
        custom: mockToastCustom,
    }),
}));

vi.mock('@/app/providers/cluster', () => ({
    useCluster: () => ({
        cluster: 'mainnet-beta',
        customUrl: undefined,
    }),
}));

let capturedOnError: ((error: unknown) => void) | undefined;

vi.mock('@solana/wallet-adapter-react', () => ({
    ConnectionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    WalletProvider: ({ children, onError }: { children: React.ReactNode; onError?: (error: unknown) => void }) => {
        capturedOnError = onError;
        return <div>{children}</div>;
    },
}));

vi.mock('@solana/wallet-adapter-react-ui', () => ({
    WalletModalProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('WalletProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        capturedOnError = undefined;
    });

    it('should show toast when skipToast is false (default)', () => {
        render(
            <WalletProvider>
                <div>Test</div>
            </WalletProvider>
        );

        capturedOnError?.(new WalletError('Test error message'));

        expect(mockToastCustom).toHaveBeenCalledWith({
            description: 'Test error message',
            title: 'Wallet Error',
            type: 'error',
        });
    });

    it('should not show toast when skipToast is true', () => {
        render(
            <WalletProvider skipToast={true}>
                <div>Test</div>
            </WalletProvider>
        );

        capturedOnError?.(new WalletError('Test error message'));

        expect(mockToastCustom).not.toHaveBeenCalled();
    });
});
