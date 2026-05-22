import { describe, expect, it } from 'vitest';

import {
    devnetMultiSolMemoTx,
    devnetSingleSolMemoTx,
    devnetTransferWithSeedTx,
    mainnetMultiSolTx,
    mainnetSingleSolTx,
    mainnetSingleUsdcTx,
    surfpoolMultiTransferTx,
} from '../__fixtures__/load-fixture';
import { collectTransferInstructions, isSolTransferInstruction, isTokenTransferInstruction } from '../lib';

describe('transfer-instruction entity against surfpool multi-transfer tx', () => {
    it('should collect the four inner transferChecked instructions, skipping closeAccount and the top-level wrapper', () => {
        const found = collectTransferInstructions(surfpoolMultiTransferTx, isTokenTransferInstruction);

        expect(found).toHaveLength(4);
        for (const ix of found) {
            expect(ix.parsed.type).toBe('transferChecked');
            expect(ix.program).toBe('spl-token');
        }
    });

    it('should expose mint, source, destination, and tokenAmount on each recognized transfer', () => {
        const [first] = collectTransferInstructions(surfpoolMultiTransferTx, isTokenTransferInstruction);

        expect(first.parsed.info).toMatchObject({
            authority: 'At4u6xXnARsRow7EzozCZ8iesMSs5zZy6tKXVs6JSw2b',
            mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        });
        if (first.parsed.type !== 'transferChecked') throw new Error('expected transferChecked');
        expect(first.parsed.info.tokenAmount?.decimals).toBe(6);
    });

    it('should find no SOL transfers in this tx (no System Program transfer instructions)', () => {
        const found = collectTransferInstructions(surfpoolMultiTransferTx, isSolTransferInstruction);
        expect(found).toHaveLength(0);
    });

    it('should reject the closeAccount inner instruction even though it shares the token program id', () => {
        const innerGroup = surfpoolMultiTransferTx.meta?.innerInstructions?.[0];
        if (!innerGroup) throw new Error('expected at least one inner instruction group');
        const closeAccount = innerGroup.instructions.find(ix => 'parsed' in ix && ix.parsed?.type === 'closeAccount');
        expect(closeAccount).toBeDefined();
        if (closeAccount) {
            expect(isTokenTransferInstruction(closeAccount)).toBe(false);
        }
    });

    it('should reject top-level wrapper instructions (custom program, not SPL/System)', () => {
        const topLevel = surfpoolMultiTransferTx.transaction.message.instructions;
        for (const ix of topLevel) {
            expect(isTokenTransferInstruction(ix)).toBe(false);
            expect(isSolTransferInstruction(ix)).toBe(false);
        }
    });
});

describe('transfer-instruction entity against real-world fixtures', () => {
    it('should recognize exactly one SOL transfer in a single-transfer mainnet tx', () => {
        const sol = collectTransferInstructions(mainnetSingleSolTx, isSolTransferInstruction);
        const token = collectTransferInstructions(mainnetSingleSolTx, isTokenTransferInstruction);
        expect(sol).toHaveLength(1);
        expect(token).toHaveLength(0);
        expect(sol[0].parsed.info.lamports).toBe(24922118);
    });

    it('should recognize exactly one token transfer in a single-USDC mainnet tx', () => {
        const sol = collectTransferInstructions(mainnetSingleUsdcTx, isSolTransferInstruction);
        const token = collectTransferInstructions(mainnetSingleUsdcTx, isTokenTransferInstruction);
        expect(sol).toHaveLength(0);
        expect(token).toHaveLength(1);
        expect(token[0].parsed.type).toBe('transferChecked');
    });

    it('should recognize one SOL transfer in a devnet single-transfer-with-memo tx (memo program not a transfer)', () => {
        const sol = collectTransferInstructions(devnetSingleSolMemoTx, isSolTransferInstruction);
        expect(sol).toHaveLength(1);
        expect(sol[0].parsed.info.lamports).toBe(100000000);
    });

    it('should recognize two SOL transfers in a mainnet multi-SOL tx with system/ComputeBudget noise', () => {
        const sol = collectTransferInstructions(mainnetMultiSolTx, isSolTransferInstruction);
        expect(sol).toHaveLength(2);
        expect(sol.map(ix => ix.parsed.info.lamports)).toEqual([105673070, 30923508650]);
    });

    it('should recognize two SOL transfers in a devnet multi-SOL-with-memo tx', () => {
        const sol = collectTransferInstructions(devnetMultiSolMemoTx, isSolTransferInstruction);
        expect(sol).toHaveLength(2);
        expect(sol.map(ix => ix.parsed.info.lamports)).toEqual([100000000, 50000000]);
    });

    it('should recognize transferWithSeed as a SOL transfer instruction on a devnet tx', () => {
        const sol = collectTransferInstructions(devnetTransferWithSeedTx, isSolTransferInstruction);
        expect(sol).toHaveLength(1);
        expect(sol[0].parsed.type).toBe('transferWithSeed');
        expect(sol[0].parsed.info.lamports).toBe(50000000);
        if (sol[0].parsed.type === 'transferWithSeed') {
            expect(sol[0].parsed.info.sourceSeed).toBe('tws-fixture');
        }
    });
});
