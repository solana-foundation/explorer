// Interop with @solana/transaction-introspection over the BUILT package: introspection turns a
// confirmed transaction into kit Instructions, and this library's decodeInstruction CONSUMES kit
// Instructions — so introspection output feeds it directly, no dependency taken (the package is a
// devDependency here only, to prove the seam). Every transaction below is assembled and compiled
// in memory, so the suite issues no RPC call. README section: "From a transaction".
import { createIdlClient } from '@explorer/idl-decode';
import { vaultIdl } from '@explorer/test-idl-program-vault';
import {
    appendTransactionMessageInstruction,
    blockhash,
    compileTransactionMessage,
    createTransactionMessage,
    generateKeyPairSigner,
    pipe,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/kit';
import { getInstructionsFromCompiledTransactionMessage, walkInstructions } from '@solana/transaction-introspection';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { depositIx } from '../src/__tests__/fixtures';
import { DEFAULT_ADDRESS } from './codama-helpers';

const compileManualTransaction = async (instruction: ReturnType<typeof depositIx>) => {
    // a generated wallet pays the fee — kit's own keypair generation, no hardcoded address
    const feePayer = await generateKeyPairSigner();
    return compileTransactionMessage(
        pipe(
            createTransactionMessage({ version: 0 }),
            message => setTransactionMessageFeePayer(feePayer.address, message),
            message =>
                setTransactionMessageLifetimeUsingBlockhash(
                    { blockhash: blockhash(DEFAULT_ADDRESS), lastValidBlockHeight: 0n },
                    message,
                ),
            message => appendTransactionMessageInstruction(instruction, message),
        ),
    );
};

describe('README flows: interop with transaction introspection', () => {
    it('should decode an instruction resolved from a compiled message without walking', async () => {
        const client = createIdlClient(vaultIdl);
        // deposit(42) rides in a compiled transaction — the instruction a wallet would have sent
        const compiledMessage = await compileManualTransaction(depositIx(vaultIdl));

        // getInstructionsFromCompiledTransactionMessage resolves the outer instructions as kit
        // Instructions — no transaction meta, no RPC
        const [instruction] = getInstructionsFromCompiledTransactionMessage(compiledMessage);

        // it drops straight into decodeInstructionData; inference is unchanged from a direct instruction
        const [, data] = client.decodeInstructionData(instruction);
        //        ^? { amount: bigint; discriminator: number } | undefined — read off vaultIdl's `deposit`
        expectTypeOf(data).toEqualTypeOf<{ amount: bigint; discriminator: number } | undefined>();
        expect(data).toEqual({ amount: 42n, discriminator: 1 });
    });

    it('should decode an instruction surfaced by walkInstructions', async () => {
        const client = createIdlClient(vaultIdl);
        const compiledMessage = await compileManualTransaction(depositIx(vaultIdl));

        // walkInstructions is the fuller entry: outer instructions followed by their inner CPI results,
        // each tagged with its position. deposit makes no CPIs, so an empty meta suffices — hand-built so
        // the suite calls no getTransaction.
        const meta = { innerInstructions: [] } as unknown as Parameters<typeof walkInstructions>[0]['meta'];
        const [outer] = walkInstructions({ compiledMessage, loadedAddresses: { readonly: [], writable: [] }, meta });

        expect(outer.trace).toEqual({ index: 0, kind: 'outer' });

        const [, data] = client.decodeInstructionData(outer);
        expectTypeOf(data).toEqualTypeOf<{ amount: bigint; discriminator: number } | undefined>();
        expect(data).toEqual({ amount: 42n, discriminator: 1 });
    });
});
