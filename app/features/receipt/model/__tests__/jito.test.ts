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

    it('returns true for SOL transfer to a Jito tip account (default list)', () => {
        const instructions = mockUsdcJitoTransferTransaction.transaction.message.instructions;
        const jitoTipInstruction = instructions[1];
        expect(isJitoTransfer(jitoTipInstruction)).toBe(true);
    });

    it('returns false for SOL transfer to a non-Jito account', () => {
        const instructions = mockSingleTransferTransaction.transaction.message.instructions;
        const solTransferInstruction = instructions[0];
        expect(isJitoTransfer(solTransferInstruction)).toBe(false);
    });

    it('returns false for non-SOL instruction', () => {
        const instructions = mockUsdcJitoTransferTransaction.transaction.message.instructions;
        const tokenTransferInstruction = instructions[0];
        expect(isJitoTransfer(tokenTransferInstruction)).toBe(false);
    });

    describe('NEXT_PUBLIC_RECEIPT_JITO_ACCOUNTS env', () => {
        it('uses custom list when NEXT_PUBLIC_RECEIPT_JITO_ACCOUNTS is set', () => {
            vi.stubEnv('NEXT_PUBLIC_RECEIPT_JITO_ACCOUNTS', `OtherAccount111,${JITO_TIP_ACCOUNT_IN_MOCK}`);
            const instructions = mockUsdcJitoTransferTransaction.transaction.message.instructions;
            const jitoTipInstruction = instructions[1];
            expect(isJitoTransfer(jitoTipInstruction)).toBe(true);
        });

        it('returns false for Jito tip instruction when custom list omits the destination', () => {
            vi.stubEnv('NEXT_PUBLIC_RECEIPT_JITO_ACCOUNTS', '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT');
            const instructions = mockUsdcJitoTransferTransaction.transaction.message.instructions;
            const jitoTipInstruction = instructions[1];
            expect(isJitoTransfer(jitoTipInstruction)).toBe(false);
        });

        it('returns true when NEXT_PUBLIC_RECEIPT_JITO_ACCOUNTS adds a non-default account and instruction targets it', () => {
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

        it('trims whitespace from comma-separated values', () => {
            vi.stubEnv('NEXT_PUBLIC_RECEIPT_JITO_ACCOUNTS', `  ${JITO_TIP_ACCOUNT_IN_MOCK}  , other`);
            const instructions = mockUsdcJitoTransferTransaction.transaction.message.instructions;
            const jitoTipInstruction = instructions[1];
            expect(isJitoTransfer(jitoTipInstruction)).toBe(true);
        });
    });
});
