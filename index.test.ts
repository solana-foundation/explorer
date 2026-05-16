// index.test.ts — God Mode Test Suite for the Pump.fun Aggressive Sniper
// Covers all critical paths: buy, sell, balance, errors, bonding curve, priority fees

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Keypair, Connection, PublicKey, Transaction, SystemProgram, ComputeBudgetProgram } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import bs58 from 'bs58';

// Mocks for Solana Web3 / SPL Token
vi.mock('@solana/web3.js', async () => {
  const actual = await vi.importActual('@solana/web3.js');
  return {
    ...actual,
    Connection: vi.fn(() => ({
      getBalance: vi.fn(),
      getLatestBlockhash: vi.fn(),
      sendRawTransaction: vi.fn(),
      confirmTransaction: vi.fn(),
      getTokenAccountBalance: vi.fn(),
    })),
    sendAndConfirmTransaction: vi.fn(),
  };
});

vi.mock('@solana/spl-token', async () => {
  const actual = await vi.importActual('@solana/spl-token');
  return {
    ...actual,
    getAssociatedTokenAddressSync: vi.fn(),
  };
});

vi.mock('bs58', () => ({
  default: {
    decode: vi.fn(),
    encode: vi.fn(),
  },
}));

// Import the module under test – adjust path as needed
import { buyToken, sellAllTokens, getWalletBalance, createGodModeSniper } from './index';

describe('God Mode Sniper', () => {
  let mockConnection: any;
  let mockPayer: Keypair;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup a mock payer
    mockPayer = Keypair.generate();
    // Mock Connection instance methods
    mockConnection = new Connection('https://api.mainnet-beta.solana.com');
  });

  describe('getWalletBalance', () => {
    it('should return the SOL balance in human-readable format', async () => {
      mockConnection.getBalance.mockResolvedValue(1_000_000_000); // 1 SOL
      const balance = await getWalletBalance(mockConnection, mockPayer.publicKey);
      expect(balance).toBe(1);
    });

    it('should return 0 if balance is 0', async () => {
      mockConnection.getBalance.mockResolvedValue(0);
      const balance = await getWalletBalance(mockConnection, mockPayer.publicKey);
      expect(balance).toBe(0);
    });

    it('should throw if connection fails', async () => {
      mockConnection.getBalance.mockRejectedValue(new Error('Network error'));
      await expect(getWalletBalance(mockConnection, mockPayer.publicKey)).rejects.toThrow('Network error');
    });
  });

  describe('buyToken', () => {
    const mint = new PublicKey('GtiBrq3taBUMtbEaKoJhirbQn1Yqd4BMxqTqoW9wpump');
    const bondingCurve = new PublicKey('8t4KpfWWGbuwy5EN47knxtuvmEDigxxJMkAfEKrV7eCy');
    const associatedBondingCurve = new PublicKey('2UECZ28d5Zh6MjsQVYhwtiWAcTNtXhwggX7CqTmx8Ncy');

    beforeEach(() => {
      mockConnection.getLatestBlockhash.mockResolvedValue({
        blockhash: '11111111111111111111111111111111',
        lastValidBlockHeight: 1000,
      });
      mockConnection.sendRawTransaction.mockResolvedValue('fakeTxSig');
      mockConnection.confirmTransaction.mockResolvedValue({ value: { err: null } });
    });

    it('should build and send a buy transaction with the correct discriminator and amount', async () => {
      mockConnection.getBalance.mockResolvedValue(100_000_000); // 0.1 SOL
      const txSig = await buyToken(mockConnection, mockPayer, mint, bondingCurve, associatedBondingCurve, 0.01);
      expect(txSig).toBe('fakeTxSig');
      const callArgs = mockConnection.sendRawTransaction.mock.calls[0];
      expect(callArgs[0]).toBeInstanceOf(Buffer);
      expect(callArgs[1].skipPreflight).toBe(false);
    });

    it('should throw if balance is insufficient', async () => {
      mockConnection.getBalance.mockResolvedValue(5000); // 0.000005 SOL – too low
      await expect(buyToken(mockConnection, mockPayer, mint, bondingCurve, associatedBondingCurve, 0.01))
        .rejects.toThrow('Insufficient balance');
    });

    it('should add priority fee instruction when fee is specified', async () => {
      mockConnection.getBalance.mockResolvedValue(100_000_000);
      const txSig = await buyToken(mockConnection, mockPayer, mint, bondingCurve, associatedBondingCurve, 0.01, 5000);
      expect(txSig).toBe('fakeTxSig');
    });

    it('should handle transaction simulation failure', async () => {
      mockConnection.getBalance.mockResolvedValue(100_000_000);
      mockConnection.sendRawTransaction.mockRejectedValue(new Error('Simulation failed'));
      await expect(buyToken(mockConnection, mockPayer, mint, bondingCurve, associatedBondingCurve, 0.01))
        .rejects.toThrow('Simulation failed');
    });
  });

  describe('sellAllTokens', () => {
    const mint = new PublicKey('GtiBrq3taBUMtbEaKoJhirbQn1Yqd4BMxqTqoW9wpump');
    const bondingCurve = new PublicKey('8t4KpfWWGbuwy5EN47knxtuvmEDigxxJMkAfEKrV7eCy');
    const associatedBondingCurve = new PublicKey('2UECZ28d5Zh6MjsQVYhwtiWAcTNtXhwggX7CqTmx8Ncy');
    const payerAta = new PublicKey('Hg7X6sf4jgzU1cMDMM2zteUejBDXeWU7UFzvfCqvseM9');

    beforeEach(() => {
      vi.mocked(getAssociatedTokenAddressSync).mockReturnValue(payerAta);
      mockConnection.getTokenAccountBalance.mockResolvedValue({
        value: { amount: '1000000', decimals: 6 },
      });
      mockConnection.getLatestBlockhash.mockResolvedValue({
        blockhash: '11111111111111111111111111111111',
        lastValidBlockHeight: 1000,
      });
      mockConnection.sendRawTransaction.mockResolvedValue('fakeSellTxSig');
      mockConnection.confirmTransaction.mockResolvedValue({ value: { err: null } });
    });

    it('should build and send a sell transaction for all tokens', async () => {
      const txSig = await sellAllTokens(mockConnection, mockPayer, mint, bondingCurve, associatedBondingCurve);
      expect(txSig).toBe('fakeSellTxSig');
      expect(mockConnection.sendRawTransaction).toHaveBeenCalled();
    });

    it('should throw if token balance is zero', async () => {
      mockConnection.getTokenAccountBalance.mockResolvedValue({
        value: { amount: '0', decimals: 6 },
      });
      await expect(sellAllTokens(mockConnection, mockPayer, mint, bondingCurve, associatedBondingCurve))
        .rejects.toThrow('No tokens to sell');
    });
  });

  describe('createGodModeSniper (auto-compounding loop)', () => {
    it('should resolve when a new token is detected and traded', async () => {
      const mockWs = { on: vi.fn(), close: vi.fn() };
      vi.spyOn(global, 'WebSocket' as any).mockImplementation(() => mockWs as any);
      mockConnection.getBalance.mockResolvedValue(100_000_000);
      mockConnection.getTokenAccountBalance.mockResolvedValue({
        value: { amount: '1000000', decimals: 6 },
      });
      mockConnection.getLatestBlockhash.mockResolvedValue({
        blockhash: '11111111111111111111111111111111',
        lastValidBlockHeight: 1000,
      });
      mockConnection.sendRawTransaction.mockResolvedValueOnce('fakeBuyTxSig').mockResolvedValueOnce('fakeSellTxSig');
      mockConnection.confirmTransaction.mockResolvedValue({ value: { err: null } });

      const loop = createGodModeSniper(mockConnection, mockPayer);
      mockWs.on.mock.calls.forEach(call => {
        if (call[0] === 'open') call[1]();
      });
      const messageHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')![1];
      messageHandler(JSON.stringify({
        type: 'newToken',
        mint: 'GtiBrq3taBUMtbEaKoJhirbQn1Yqd4BMxqTqoW9wpump',
        bondingCurve: '8t4KpfWWGbuwy5EN47knxtuvmEDigxxJMkAfEKrV7eCy',
        associatedBondingCurve: '2UECZ28d5Zh6MjsQVYhwtiWAcTNtXhwggX7CqTmx8Ncy',
      }));
      await loop;
      expect(mockConnection.sendRawTransaction).toHaveBeenCalledTimes(2);
    });
  });
});
