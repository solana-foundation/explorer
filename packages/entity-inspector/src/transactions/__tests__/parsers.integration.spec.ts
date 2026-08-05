import { getBase58Decoder } from '@solana/kit';
import { describe, expect, it, vi } from 'vitest';

import { gen } from '../../__tests__/gen.js';
import type { InspectorLogger } from '../../logger.js';
import type { ResolvedAccount, TransactionPayloadContext } from '../types.js';
import { decodeTransactionInstructions } from '../decode-instructions.js';

// End-to-end through the real @explorer/parsers decoder: raw instruction bytes in, decoded fields
// out, no host-app fallback involved. Field-level decode branches are covered in the parsers package.
describe('@explorer/parsers integration', () => {
    it('should decode a system transfer from raw bytes without the host-app fallback', async () => {
        const SYSTEM_PROGRAM = gen.systemProgram;
        const SOURCE = gen.wrappedSol;
        const DESTINATION = gen.sysvarRent;
        const accounts: ResolvedAccount[] = [
            { address: SOURCE, signer: true, source: 'static', writable: true },
            { address: DESTINATION, signer: false, source: 'static', writable: true },
            { address: SYSTEM_PROGRAM, signer: false, source: 'static', writable: false },
        ];
        const logger: InspectorLogger = { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() };
        // TransferSol wire format: u32 discriminator (2) + u64 lamports, both little-endian.
        const transferData = new Uint8Array([2, 0, 0, 0, 42, 0, 0, 0, 0, 0, 0, 0]);
        const context: TransactionPayloadContext = {
            accountKeys: accounts.map(account => account.address),
            blockTime: 456,
            computeUnitsConsumed: 99,
            confirmationStatus: null,
            confirmations: null,
            err: null,
            feeLamports: 5000,
            innerInstructions: null,
            instructions: [{ accounts: [0, 1], data: getBase58Decoder().decode(transferData), programIdIndex: 2 }],
            logMessages: null,
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
            numRequiredSignatures: 1,
            recentBlockhash: null,
            resolvedAccounts: accounts,
            signature: 'sig',
            slot: 123,
            status: 'success',
            version: 'legacy',
        };

        const entries = await decodeTransactionInstructions(context, { logger });

        expect(entries[0]).toMatchObject({
            decoded: { program: 'system', type: 'transfer' },
            source: 'bundled',
        });
        const info = entries[0].decoded?.info;
        expect(info).toMatchObject({ lamports: 42 });
        expect(String((info as { source: unknown }).source)).toBe(SOURCE);
        expect(String((info as { destination: unknown }).destination)).toBe(DESTINATION);
        expect(logger.warn).not.toHaveBeenCalled();
    });
});
