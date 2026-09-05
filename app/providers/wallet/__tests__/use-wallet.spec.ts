import { PublicKey } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { useWallet } from '../use-wallet';

const { mockUseConnectedWallet, mockUseDisconnect, mockUseWalletStatus } = vi.hoisted(() => ({
    mockUseConnectedWallet: vi.fn(),
    mockUseDisconnect: vi.fn(),
    mockUseWalletStatus: vi.fn(),
}));

vi.mock('@solana/kit-plugin-wallet/react', () => ({
    useConnectedWallet: mockUseConnectedWallet,
    useDisconnect: mockUseDisconnect,
    useWalletStatus: mockUseWalletStatus,
}));

vi.mock('@/app/providers/wallet-provider', () => ({
    useWalletClient: () => ({}),
}));

const VALID_ADDRESS = PublicKey.default.toBase58();

type WalletState = { address?: string; hasSigner?: boolean; status?: string };

function mockWalletState({ address, hasSigner = true, status = 'connected' }: WalletState) {
    mockUseWalletStatus.mockReturnValue(status);
    mockUseConnectedWallet.mockReturnValue(
        address
            ? {
                  account: { address },
                  signer: hasSigner ? { address } : undefined,
                  wallet: { name: 'Test Wallet' },
              }
            : undefined,
    );
}

describe('useWallet', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(Logger, 'error').mockImplementation(() => {});
        mockUseDisconnect.mockReturnValue({ dispatch: vi.fn(), error: undefined });
    });

    it('should expose the connected account as a PublicKey', () => {
        mockWalletState({ address: VALID_ADDRESS });

        const { result } = renderHook(() => useWallet());

        expect(result.current.publicKey?.toBase58()).toBe(VALID_ADDRESS);
        expect(result.current.canSign).toBe(true);
        expect(result.current.connected).toBe(true);
        expect(result.current.walletName).toBe('Test Wallet');
    });

    it('should report no account instead of throwing when the wallet reports an unparsable address', () => {
        mockWalletState({ address: 'not-a-base58-public-key' });

        const { result } = renderHook(() => useWallet());

        expect(result.current.publicKey).toBeUndefined();
        expect(result.current.canSign).toBe(false);
        expect(Logger.error).toHaveBeenCalled();
    });

    it('should keep the same PublicKey instance while the address is unchanged', () => {
        mockWalletState({ address: VALID_ADDRESS });

        const { result, rerender } = renderHook(() => useWallet());
        const first = result.current.publicKey;
        rerender();

        expect(result.current.publicKey).toBe(first);
    });

    it('should report a watch-only wallet as connected but unable to sign', () => {
        mockWalletState({ address: VALID_ADDRESS, hasSigner: false });

        const { result } = renderHook(() => useWallet());

        expect(result.current.connected).toBe(true);
        expect(result.current.canSign).toBe(false);
        expect(result.current.signTransaction).toBeUndefined();
        expect(result.current.signAllTransactions).toBeUndefined();
    });

    it.each(['connecting', 'reconnecting', 'pending'])('should report %s as connecting', status => {
        mockWalletState({ status });

        const { result } = renderHook(() => useWallet());

        expect(result.current.connecting).toBe(true);
        expect(result.current.connected).toBe(false);
    });

    it('should report a disconnected wallet as neither connected nor connecting', () => {
        mockWalletState({ status: 'disconnected' });

        const { result } = renderHook(() => useWallet());

        expect(result.current.connected).toBe(false);
        expect(result.current.connecting).toBe(false);
        expect(result.current.publicKey).toBeUndefined();
    });

    it('should log a disconnect failure', () => {
        mockWalletState({ address: VALID_ADDRESS });
        const error = new Error('disconnect rejected');
        mockUseDisconnect.mockReturnValue({ dispatch: vi.fn(), error });

        renderHook(() => useWallet());

        expect(Logger.error).toHaveBeenCalledWith(error, { sentry: true });
    });
});
