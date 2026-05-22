import { describe, expect, it } from 'vitest';

import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, SystemProgram } from '@solana/web3.js';

import {
    devnetMultiSolMemoTx,
    devnetSingleSolMemoTx,
    devnetSolWithAtaRentTx,
    devnetTransferWithSeedTx,
    mainnetMultiSolTx,
    mainnetSingleSolTx,
    mainnetSingleUsdcTx,
    surfpoolMultiTransferTx,
} from '../__fixtures__/load-fixture';
import {
    collectTransferInstructions,
    isRentFundingProgram,
    isSolTransferInstruction,
    isTokenTransferInstruction,
} from '../lib';

describe('transfer-instruction entity against surfpool multi-transfer tx', () => {
    it('should collect the four inner transferChecked instructions, skipping closeAccount and the top-level wrapper', () => {
        const found = collectTransferInstructions(surfpoolMultiTransferTx, isTokenTransferInstruction);

        expect(found).toHaveLength(4);
        for (const { instruction } of found) {
            expect(instruction.parsed.type).toBe('transferChecked');
            expect(instruction.program).toBe('spl-token');
        }
    });

    it('should expose mint, source, destination, and tokenAmount on each recognized transfer', () => {
        const [first] = collectTransferInstructions(surfpoolMultiTransferTx, isTokenTransferInstruction);

        expect(first.instruction.parsed.info).toMatchObject({
            authority: 'At4u6xXnARsRow7EzozCZ8iesMSs5zZy6tKXVs6JSw2b',
            mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        });
        if (first.instruction.parsed.type !== 'transferChecked') throw new Error('expected transferChecked');
        expect(first.instruction.parsed.info.tokenAmount?.decimals).toBe(6);
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
        expect(sol[0].instruction.parsed.info.lamports).toBe(24922118);
    });

    it('should recognize exactly one token transfer in a single-USDC mainnet tx', () => {
        const sol = collectTransferInstructions(mainnetSingleUsdcTx, isSolTransferInstruction);
        const token = collectTransferInstructions(mainnetSingleUsdcTx, isTokenTransferInstruction);
        expect(sol).toHaveLength(0);
        expect(token).toHaveLength(1);
        expect(token[0].instruction.parsed.type).toBe('transferChecked');
    });

    it('should recognize one SOL transfer in a devnet single-transfer-with-memo tx (memo program not a transfer)', () => {
        const sol = collectTransferInstructions(devnetSingleSolMemoTx, isSolTransferInstruction);
        expect(sol).toHaveLength(1);
        expect(sol[0].instruction.parsed.info.lamports).toBe(100000000);
    });

    it('should recognize two SOL transfers in a mainnet multi-SOL tx with system/ComputeBudget noise', () => {
        const sol = collectTransferInstructions(mainnetMultiSolTx, isSolTransferInstruction);
        expect(sol).toHaveLength(2);
        expect(sol.map(({ instruction }) => instruction.parsed.info.lamports)).toEqual([105673070, 30923508650]);
    });

    it('should recognize two SOL transfers in a devnet multi-SOL-with-memo tx', () => {
        const sol = collectTransferInstructions(devnetMultiSolMemoTx, isSolTransferInstruction);
        expect(sol).toHaveLength(2);
        expect(sol.map(({ instruction }) => instruction.parsed.info.lamports)).toEqual([100000000, 50000000]);
    });

    it('should recognize transferWithSeed as a SOL transfer instruction on a devnet tx', () => {
        const sol = collectTransferInstructions(devnetTransferWithSeedTx, isSolTransferInstruction);
        expect(sol).toHaveLength(1);
        expect(sol[0].instruction.parsed.type).toBe('transferWithSeed');
        expect(sol[0].instruction.parsed.info.lamports).toBe(50000000);
        if (sol[0].instruction.parsed.type === 'transferWithSeed') {
            expect(sol[0].instruction.parsed.info.sourceSeed).toBe('tws-fixture');
        }
    });
});

describe('collectTransferInstructions location metadata', () => {
    it('should report a top-level match with the parent index and an undefined innerIndex', () => {
        const sol = collectTransferInstructions(mainnetSingleSolTx, isSolTransferInstruction);
        expect(sol).toHaveLength(1);
        expect(sol[0].topLevelIndex).toBe(0);
        expect(sol[0].innerIndex).toBeUndefined();
    });

    it('should carry the parent topLevelIndex for each top-level match when other instructions sit before them', () => {
        // mainnetMultiSolTx top-level layout: [advanceNonce, ComputeBudget, ComputeBudget, transfer, transfer].
        // The two transfers sit at topLevelIndex 3 and 4; neither came from inner instructions.
        const sol = collectTransferInstructions(mainnetMultiSolTx, isSolTransferInstruction);
        expect(sol.map(({ topLevelIndex, innerIndex }) => ({ innerIndex, topLevelIndex }))).toEqual([
            { innerIndex: undefined, topLevelIndex: 3 },
            { innerIndex: undefined, topLevelIndex: 4 },
        ]);
    });

    it('should distinguish inner matches by innerIndex while preserving the parent topLevelIndex', () => {
        // Surfpool wrapper emits 4 transferChecked + 1 closeAccount under top-level index 2.
        const found = collectTransferInstructions(surfpoolMultiTransferTx, isTokenTransferInstruction);

        expect(found.map(({ topLevelIndex, innerIndex }) => ({ innerIndex, topLevelIndex }))).toEqual([
            { innerIndex: 0, topLevelIndex: 2 },
            { innerIndex: 1, topLevelIndex: 2 },
            { innerIndex: 2, topLevelIndex: 2 },
            { innerIndex: 3, topLevelIndex: 2 },
        ]);
    });
});

describe('isRentFundingProgram', () => {
    it('should recognize the Associated Token Account program', () => {
        expect(isRentFundingProgram(ASSOCIATED_TOKEN_PROGRAM_ID)).toBe(true);
    });

    it('should not flag the System program', () => {
        expect(isRentFundingProgram(SystemProgram.programId)).toBe(false);
    });

    it('should not flag arbitrary program IDs', () => {
        expect(isRentFundingProgram(new PublicKey('11111111111111111111111111111112'))).toBe(false);
    });
});

describe('collectTransferInstructions against ATA rent-funding fixture', () => {
    // Real devnet tx: top-level System.transfer (intent) + top-level ATA CreateIdempotent.
    // The ATA program CPIs an inner System.transfer for rent top-up — that's the spurious
    // match the receipt layer must filter out.
    it('should surface both the top-level payment and the inner rent transfer raw', () => {
        const sol = collectTransferInstructions(devnetSolWithAtaRentTx, isSolTransferInstruction);
        expect(sol.map(({ topLevelIndex, innerIndex }) => ({ innerIndex, topLevelIndex }))).toEqual([
            { innerIndex: undefined, topLevelIndex: 0 },
            { innerIndex: 1, topLevelIndex: 1 },
        ]);
    });

    it('should let the receipt layer drop the inner match by inspecting the parent program', () => {
        const sol = collectTransferInstructions(devnetSolWithAtaRentTx, isSolTransferInstruction);
        const topLevel = devnetSolWithAtaRentTx.transaction.message.instructions;
        const filtered = sol.filter(({ innerIndex, topLevelIndex }) => {
            if (innerIndex === undefined) return true;
            return !isRentFundingProgram(topLevel[topLevelIndex].programId);
        });
        expect(filtered.map(({ topLevelIndex, innerIndex }) => ({ innerIndex, topLevelIndex }))).toEqual([
            { innerIndex: undefined, topLevelIndex: 0 },
        ]);
    });
});
