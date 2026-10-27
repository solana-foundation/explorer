import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { OPEN_BOOK_PROGRAM_IDS, SERUM_DEX_V3_PROGRAM_IDS, SERUM_PROGRAM_IDS } from '@explorer/decoder-serum';
import { AccountRole, address, getBase16Encoder } from '@solana/kit';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { serumInstructionParsers } from '../lib/serum-client';
import { parseSerumInstruction, SERUM_PROGRAM_LABEL } from '../lib/serum-parser';

const MARKET = address('FagABcRBhZH27JDtu6A1Jo9woXyoznP28QujLkxkN9Hj');
const EVENT_QUEUE = address('7txXZZD6Um59YoLMF7XUNimbMjsqsWhc7g2EniiTrmp1');
const OPEN_ORDERS = address('GgU1RSCbCTNfjPqBGnR7NBDZoLQwB7oEjnHqzGtcCLBH');

// Consume Events, limit 32 — from mainnet OpenBook tx 2DJ9K7gZfmtU….
const CONSUME_EVENTS = new Uint8Array(getBase16Encoder().encode('00030000002000'));
// Two trailing accounts the Consume Events layout ignores (coin/pc fee receivers).
const ACCOUNTS = [OPEN_ORDERS, MARKET, EVENT_QUEUE, OPEN_ORDERS, OPEN_ORDERS].map(account => ({
    address: account,
    role: AccountRole.WRITABLE,
}));

describe('parseSerumInstruction', () => {
    beforeEach(() => {
        vi.mocked(Logger.error).mockClear();
    });

    it('should decode an OpenBook instruction to its canonical shape', () => {
        const parsed = parseSerumInstruction({
            accounts: ACCOUNTS,
            data: CONSUME_EVENTS,
            programAddress: OPEN_BOOK_PROGRAM_IDS.mainnet,
        });

        expect(parsed).toEqual({
            info: {
                accounts: { eventQueue: EVENT_QUEUE, market: MARKET, openOrders: [OPEN_ORDERS] },
                data: { limit: 32 },
            },
            type: 'consumeEvents',
        });
    });

    it('should name an instruction on a deprecated Serum deployment without decoding it', () => {
        const parsed = parseSerumInstruction({
            accounts: ACCOUNTS,
            data: CONSUME_EVENTS,
            programAddress: SERUM_DEX_V3_PROGRAM_IDS.mainnet,
        });

        expect(parsed).toEqual({ info: {}, type: 'consumeEvents' });
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should return undefined without reporting an unrecognized code on a deprecated deployment', () => {
        const parsed = parseSerumInstruction({
            accounts: [],
            data: new Uint8Array([0, 255, 0, 0, 0]),
            programAddress: SERUM_DEX_V3_PROGRAM_IDS.mainnet,
        });

        expect(parsed).toBeUndefined();
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it.each([
        [7, 'disableMarket'],
        [8, 'sweepFees'],
        [9, 'newOrderV2'],
        [13, 'sendTake'],
    ] as const)('should name code %i without decoding or reporting it', (code, type) => {
        const parsed = parseSerumInstruction({
            accounts: [],
            data: new Uint8Array([0, code, 0, 0, 0]),
            programAddress: OPEN_BOOK_PROGRAM_IDS.mainnet,
        });

        expect(parsed).toEqual({ info: {}, type });
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should report but still name a recognized code whose payload is truncated', () => {
        const parsed = parseSerumInstruction({
            accounts: [],
            data: new Uint8Array([0, 10, 0, 0, 0, 1]),
            programAddress: OPEN_BOOK_PROGRAM_IDS.mainnet,
        });

        expect(parsed).toEqual({ info: {}, type: 'newOrderV3' });
        expect(Logger.error).toHaveBeenCalledOnce();
    });

    it('should report and return undefined for an unrecognized code', () => {
        const parsed = parseSerumInstruction({
            accounts: [],
            data: new Uint8Array([0, 255, 0, 0, 0]),
            programAddress: OPEN_BOOK_PROGRAM_IDS.mainnet,
        });

        expect(parsed).toBeUndefined();
        expect(Logger.error).toHaveBeenCalledOnce();
    });

    it('should report and return undefined for data too short to hold a code', () => {
        const parsed = parseSerumInstruction({
            accounts: [],
            data: new Uint8Array(0),
            programAddress: OPEN_BOOK_PROGRAM_IDS.mainnet,
        });

        expect(parsed).toBeUndefined();
        expect(Logger.error).toHaveBeenCalledOnce();
    });
});

describe('serumInstructionParsers', () => {
    it('should register every DEX deployment under the serum label', () => {
        const dispatcher = createInstructionParserDispatcher(serumInstructionParsers);

        for (const programId of SERUM_PROGRAM_IDS) {
            expect(dispatcher.getInstructionParser(programId)?.programLabel).toBe(SERUM_PROGRAM_LABEL);
        }
    });

    it('should decode through the dispatcher', () => {
        const dispatcher = createInstructionParserDispatcher(serumInstructionParsers);
        const raw = new TransactionInstruction({
            data: Buffer.from(CONSUME_EVENTS),
            keys: ACCOUNTS.map(account => ({
                isSigner: false,
                isWritable: true,
                pubkey: new PublicKey(account.address),
            })),
            programId: new PublicKey(OPEN_BOOK_PROGRAM_IDS.mainnet),
        });

        const dispatched = dispatcher.fromTransactionInstruction(raw);

        expect(dispatched).toMatchObject({ parsed: { type: 'consumeEvents' }, program: SERUM_PROGRAM_LABEL });
    });
});
