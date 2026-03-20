import { PublicKey, SystemProgram } from '@solana/web3.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockSingleTransferTransaction } from '../../mocks/single-transfer';
import { mockUsdcJitoTransferTransaction } from '../../mocks/usdc-jito-transfer';
import { isJitoTransfer } from '../jito';

const JITO_TIP_ACCOUNT_IN_MOCK = '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5';

describe('isJitoTransfer', () => {
    beforeEach(() => {
        vi.stubEnv('NEXT_PUBLIC_RECEIPT_JITO_ACCOUNTS', '');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('should return true for SOL transfer to a Jito tip account (default list)', () => {
        const instructions = mockUsdcJitoTransferTransaction.transaction.message.instructions;
        const jitoTipInstruction = instructions[1];
        expect(isJitoTransfer(jitoTipInstruction)).toBe(true);
    });

    it('should return true when parsed.info.destination is a PublicKey (Jito tip account)', () => {
        const instruction = {
            parsed: {
                info: {
                    destination: new PublicKey(JITO_TIP_ACCOUNT_IN_MOCK),
                    lamports: 10000,
                    source: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
                },
                type: 'transfer',
            },
            program: 'system',
            programId: SystemProgram.programId,
        };
        expect(isJitoTransfer(instruction)).toBe(true);
    });

    it('should return false for SOL transfer to a non-Jito account', () => {
        const instructions = mockSingleTransferTransaction.transaction.message.instructions;
        const solTransferInstruction = instructions[0];
        expect(isJitoTransfer(solTransferInstruction)).toBe(false);
    });

    it('should return false for non-SOL instruction', () => {
        const instructions = mockUsdcJitoTransferTransaction.transaction.message.instructions;
        const tokenTransferInstruction = instructions[0];
        expect(isJitoTransfer(tokenTransferInstruction)).toBe(false);
    });

    describe('NEXT_PUBLIC_RECEIPT_JITO_ACCOUNTS env', () => {
        it('should use custom list when NEXT_PUBLIC_RECEIPT_JITO_ACCOUNTS is set', () => {
            vi.stubEnv('NEXT_PUBLIC_RECEIPT_JITO_ACCOUNTS', `OtherAccount111,${JITO_TIP_ACCOUNT_IN_MOCK}`);
            const instructions = mockUsdcJitoTransferTransaction.transaction.message.instructions;
            const jitoTipInstruction = instructions[1];
            expect(isJitoTransfer(jitoTipInstruction)).toBe(true);
        });

        it('should return false for Jito tip instruction when custom list omits the destination', () => {
            vi.stubEnv('NEXT_PUBLIC_RECEIPT_JITO_ACCOUNTS', '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT');
            const instructions = mockUsdcJitoTransferTransaction.transaction.message.instructions;
            const jitoTipInstruction = instructions[1];
            expect(isJitoTransfer(jitoTipInstruction)).toBe(false);
        });

        it('should return true when NEXT_PUBLIC_RECEIPT_JITO_ACCOUNTS adds a non-default account and instruction targets it', () => {
            const customAccount = 'CustomJitoTipAccount1111111111111111111111111';
            vi.stubEnv('NEXT_PUBLIC_RECEIPT_JITO_ACCOUNTS', customAccount);
            const instructions = mockUsdcJitoTransferTransaction.transaction.message.instructions;
            const jitoTipInstruction = instructions[1];
            expect(isJitoTransfer(jitoTipInstruction)).toBe(false);
            const customInstruction = {
                ...jitoTipInstruction,
                parsed: {
                    ...jitoTipInstruction.parsed,
                    info: {
                        ...(jitoTipInstruction.parsed as { info: { destination?: string } }).info,
                        destination: customAccount,
                    },
                },
            };
            expect(isJitoTransfer(customInstruction)).toBe(true);
        });

        it('should trim whitespace from comma-separated values', () => {
            vi.stubEnv('NEXT_PUBLIC_RECEIPT_JITO_ACCOUNTS', `  ${JITO_TIP_ACCOUNT_IN_MOCK}  , other`);
            const instructions = mockUsdcJitoTransferTransaction.transaction.message.instructions;
            const jitoTipInstruction = instructions[1];
            expect(isJitoTransfer(jitoTipInstruction)).toBe(true);
        });
    });
});
