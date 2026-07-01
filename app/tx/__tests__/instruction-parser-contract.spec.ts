import { CreateIdempotentInfo } from '@components/instruction/associated-token/types';
import { TransferInfo } from '@components/instruction/system/types';
import { getTokenIxValidator, TransferChecked } from '@components/instruction/token/types';
import {
    createInstructionParserDispatcher,
    type DispatchResult,
    isParsedInstruction,
} from '@entities/instruction-parser';
import { associatedTokenInstructionParser } from '@features/decode-instruction-associated-token';
import { LIGHTHOUSE_ADDRESS, lighthouseInstructionParser } from '@features/decode-instruction-lighthouse';
import { systemInstructionParser } from '@features/decode-instruction-system';
import { tokenInstructionParser } from '@features/decode-instruction-token';
import { token2022InstructionParser } from '@features/decode-instruction-token-2022';
import { address } from '@solana/kit';
import { Keypair, type ParsedInstruction, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ADDRESS, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { getInitializeMetadataPointerInstruction, TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import { create } from 'superstruct';
import { describe, expect, test } from 'vitest';

/**
 * Contract test: both pipelines (inspector via `fromTransactionInstruction`
 * and tx-page via `fromParsedInstruction`) must produce `parsed.info` payloads
 * that yield equivalent values for the same logical instruction.
 *
 * Two shapes of assertion appear here:
 * - **Same-validator parity** (System Transfer, SPL Token TransferChecked,
 *   Token-2022 InitializeMetadataPointer): the byte path normalises into the
 *   same RPC-info shape the superstruct validator expects, so both paths are
 *   validated by the same struct and compared field-for-field.
 * - **Mapped parity** (Associated Token createIdempotent): the byte path emits
 *   `@solana-program/token` kit-shaped objects (`accounts.{payer,ata,owner,…}`)
 *   while the RPC path emits the `CreateIdempotentInfo` shape
 *   (`{source,account,wallet,…}`). The two don't share a validator, so we map
 *   between them and assert the addresses agree. This guards the account
 *   ordering — exactly the class of latent bug the migration fixed.
 *
 * MPL Token Metadata has no parity test by necessity: the RPC never pre-parses
 * it, so there is no `fromParsed` path to compare against.
 */
describe('instruction-parser contract', () => {
    test('should produce equivalent info for byte-parsed and RPC-parsed System Transfer paths', () => {
        const dispatcher = createInstructionParserDispatcher([systemInstructionParser]);

        const source = Keypair.generate().publicKey;
        const destination = Keypair.generate().publicKey;
        const lamports = 1_500_000;

        const rawIx = SystemProgram.transfer({ fromPubkey: source, lamports, toPubkey: destination });

        // Byte-parsed path (Inspector): raw TransactionInstruction -> ParsedInstruction
        const byteParsed = dispatcher.fromTransactionInstruction(rawIx);

        // RPC-pre-parsed path (tx page): RPC's output -> dispatcher.fromParsedInstruction
        // -> slice's fromParsed -> wrapped back to ParsedInstruction.
        const rpcInput: ParsedInstruction = {
            parsed: {
                info: {
                    destination: destination.toBase58(),
                    lamports,
                    source: source.toBase58(),
                },
                type: 'transfer',
            },
            program: 'system',
            programId: SystemProgram.programId,
        };
        const rpcParsed = dispatcher.fromParsedInstruction(rpcInput);

        if (!isParsedInstruction(byteParsed)) {
            throw new Error('byte-parsed System Transfer should be recognised');
        }

        // Both paths produce identical program + type identification.
        expect(byteParsed.program).toBe('system');
        expect(rpcParsed.program).toBe('system');
        expect(byteParsed.programId.equals(SystemProgram.programId)).toBe(true);
        expect(rpcParsed.programId.equals(SystemProgram.programId)).toBe(true);
        expect(byteParsed.parsed.type).toBe('transfer');
        expect(rpcParsed.parsed.type).toBe('transfer');

        // Both info payloads satisfy the TransferInfo superstruct validator
        // and produce equivalent PublicKey / lamport values.
        const byteInfo = create(byteParsed.parsed.info, TransferInfo);
        const rpcInfo = create(rpcParsed.parsed.info, TransferInfo);

        expect(byteInfo.lamports).toBe(rpcInfo.lamports);
        expect(byteInfo.source.equals(rpcInfo.source)).toBe(true);
        expect(byteInfo.destination.equals(rpcInfo.destination)).toBe(true);

        expect(byteInfo.lamports).toBe(lamports);
        expect(byteInfo.source.equals(source)).toBe(true);
        expect(byteInfo.destination.equals(destination)).toBe(true);
    });

    test('should produce equivalent info for byte-parsed and RPC-parsed SPL Token TransferChecked paths', () => {
        const dispatcher = createInstructionParserDispatcher([tokenInstructionParser]);

        const source = Keypair.generate().publicKey;
        const mint = Keypair.generate().publicKey;
        const destination = Keypair.generate().publicKey;
        const authority = Keypair.generate().publicKey;
        const amount = 1_000n;
        const decimals = 6;
        const tokenProgramId = new PublicKey(TOKEN_PROGRAM_ADDRESS);

        // TransferChecked wire layout: [discriminator=12, amount u64 LE, decimals u8].
        const data = Buffer.alloc(10);
        data.writeUInt8(12, 0);
        data.writeBigUInt64LE(amount, 1);
        data.writeUInt8(decimals, 9);
        const rawIx = new TransactionInstruction({
            data,
            keys: [
                { isSigner: false, isWritable: true, pubkey: source },
                { isSigner: false, isWritable: false, pubkey: mint },
                { isSigner: false, isWritable: true, pubkey: destination },
                { isSigner: true, isWritable: false, pubkey: authority },
            ],
            programId: tokenProgramId,
        });

        // Byte-parsed path (Inspector): raw TransactionInstruction -> ParsedInstruction
        const byteParsed = dispatcher.fromTransactionInstruction(rawIx);

        // RPC-pre-parsed path (tx page): RPC's transferChecked shape -> dispatcher.
        const rpcInput: ParsedInstruction = {
            parsed: {
                info: {
                    authority: authority.toBase58(),
                    destination: destination.toBase58(),
                    mint: mint.toBase58(),
                    source: source.toBase58(),
                    tokenAmount: { amount: amount.toString(), decimals, uiAmountString: '0.001' },
                },
                type: 'transferChecked',
            },
            program: 'spl-token',
            programId: tokenProgramId,
        };
        const rpcParsed = dispatcher.fromParsedInstruction(rpcInput);

        if (!isParsedInstruction(byteParsed)) {
            throw new Error('byte-parsed SPL Token TransferChecked should be recognised');
        }

        expect(byteParsed.program).toBe('spl-token');
        expect(rpcParsed.program).toBe('spl-token');
        expect(byteParsed.parsed.type).toBe('transferChecked');
        expect(rpcParsed.parsed.type).toBe('transferChecked');

        const byteInfo = create(byteParsed.parsed.info, TransferChecked);
        const rpcInfo = create(rpcParsed.parsed.info, TransferChecked);

        // The load-bearing fields agree across both paths. (uiAmountString is a
        // display-formatting field whose RPC spelling may differ; not asserted.)
        if (!byteInfo.authority || !rpcInfo.authority) throw new Error('TransferChecked authority must be present');
        expect(byteInfo.source.equals(rpcInfo.source)).toBe(true);
        expect(byteInfo.destination.equals(rpcInfo.destination)).toBe(true);
        expect(byteInfo.mint.equals(rpcInfo.mint)).toBe(true);
        expect(byteInfo.authority.equals(rpcInfo.authority)).toBe(true);
        expect(byteInfo.tokenAmount.amount).toBe(rpcInfo.tokenAmount.amount);
        expect(byteInfo.tokenAmount.decimals).toBe(rpcInfo.tokenAmount.decimals);

        expect(byteInfo.tokenAmount.amount).toBe(amount.toString());
        expect(byteInfo.tokenAmount.decimals).toBe(decimals);
        expect(byteInfo.source.equals(source)).toBe(true);
        expect(byteInfo.authority.equals(authority)).toBe(true);
    });

    test('should produce equivalent info for byte-parsed and RPC-parsed Token-2022 TransferChecked paths', () => {
        const dispatcher = createInstructionParserDispatcher([token2022InstructionParser]);

        const source = Keypair.generate().publicKey;
        const mint = Keypair.generate().publicKey;
        const destination = Keypair.generate().publicKey;
        const authority = Keypair.generate().publicKey;
        const amount = 1_000n;
        const decimals = 6;
        const programId = new PublicKey(TOKEN_2022_PROGRAM_ADDRESS);

        // TransferChecked wire layout is identical to SPL Token:
        // [discriminator=12, amount u64 LE, decimals u8].
        const data = Buffer.alloc(10);
        data.writeUInt8(12, 0);
        data.writeBigUInt64LE(amount, 1);
        data.writeUInt8(decimals, 9);
        const rawIx = new TransactionInstruction({
            data,
            keys: [
                { isSigner: false, isWritable: true, pubkey: source },
                { isSigner: false, isWritable: false, pubkey: mint },
                { isSigner: false, isWritable: true, pubkey: destination },
                { isSigner: true, isWritable: false, pubkey: authority },
            ],
            programId,
        });

        // Byte-parsed path (Inspector): raw TransactionInstruction -> ParsedInstruction.
        const byteParsed = dispatcher.fromTransactionInstruction(rawIx);

        // RPC-pre-parsed path (tx page): RPC's transferChecked shape -> dispatcher.
        const rpcInput: ParsedInstruction = {
            parsed: {
                info: {
                    authority: authority.toBase58(),
                    destination: destination.toBase58(),
                    mint: mint.toBase58(),
                    source: source.toBase58(),
                    tokenAmount: { amount: amount.toString(), decimals, uiAmountString: '0.001' },
                },
                type: 'transferChecked',
            },
            program: 'spl-token-2022',
            programId,
        };
        const rpcParsed = dispatcher.fromParsedInstruction(rpcInput);

        if (!isParsedInstruction(byteParsed)) {
            throw new Error('byte-parsed Token-2022 TransferChecked should be recognised');
        }

        expect(byteParsed.program).toBe('spl-token-2022');
        expect(rpcParsed.program).toBe('spl-token-2022');
        expect(byteParsed.parsed.type).toBe('transferChecked');
        expect(rpcParsed.parsed.type).toBe('transferChecked');

        const byteInfo = create(byteParsed.parsed.info, TransferChecked);
        const rpcInfo = create(rpcParsed.parsed.info, TransferChecked);

        if (!byteInfo.authority || !rpcInfo.authority) throw new Error('TransferChecked authority must be present');
        expect(byteInfo.source.equals(rpcInfo.source)).toBe(true);
        expect(byteInfo.destination.equals(rpcInfo.destination)).toBe(true);
        expect(byteInfo.mint.equals(rpcInfo.mint)).toBe(true);
        expect(byteInfo.authority.equals(rpcInfo.authority)).toBe(true);
        expect(byteInfo.tokenAmount.amount).toBe(rpcInfo.tokenAmount.amount);
        expect(byteInfo.tokenAmount.decimals).toBe(rpcInfo.tokenAmount.decimals);

        expect(byteInfo.tokenAmount.amount).toBe(amount.toString());
        expect(byteInfo.tokenAmount.decimals).toBe(decimals);
        expect(byteInfo.source.equals(source)).toBe(true);
        expect(byteInfo.authority.equals(authority)).toBe(true);
    });

    test('should produce equivalent info for byte-parsed and RPC-parsed Token-2022 InitializeMetadataPointer paths', () => {
        const dispatcher = createInstructionParserDispatcher([token2022InstructionParser]);

        const mint = Keypair.generate().publicKey;
        const authority = Keypair.generate().publicKey;
        const metadataAddress = Keypair.generate().publicKey;
        const programId = new PublicKey(TOKEN_2022_PROGRAM_ADDRESS);

        // Build the raw instruction bytes with the kit builder, then wrap as a
        // web3.js TransactionInstruction for the byte path. (Extension
        // discriminators are multi-byte; let the encoder produce them.)
        const kitIx = getInitializeMetadataPointerInstruction({
            authority: address(authority.toBase58()),
            metadataAddress: address(metadataAddress.toBase58()),
            mint: address(mint.toBase58()),
        });
        const rawIx = new TransactionInstruction({
            data: Buffer.from(kitIx.data),
            keys: kitIx.accounts.map(a => ({ isSigner: false, isWritable: false, pubkey: new PublicKey(a.address) })),
            programId,
        });

        const byteParsed = dispatcher.fromTransactionInstruction(rawIx);

        const rpcInput: ParsedInstruction = {
            parsed: {
                info: {
                    authority: authority.toBase58(),
                    metadataAddress: metadataAddress.toBase58(),
                    mint: mint.toBase58(),
                },
                type: 'initializeMetadataPointer',
            },
            program: 'spl-token-2022',
            programId,
        };
        const rpcParsed = dispatcher.fromParsedInstruction(rpcInput);

        if (!isParsedInstruction(byteParsed)) {
            throw new Error('byte-parsed Token-2022 InitializeMetadataPointer should be recognised');
        }
        expect(byteParsed.parsed.type).toBe('initializeMetadataPointer');
        expect(rpcParsed.parsed.type).toBe('initializeMetadataPointer');

        const validator = getTokenIxValidator('initializeMetadataPointer');
        if (!validator) throw new Error('expected a validator for initializeMetadataPointer');
        const byteInfo = create(byteParsed.parsed.info, validator) as {
            authority: PublicKey;
            metadataAddress: PublicKey;
            mint: PublicKey;
        };
        const rpcInfo = create(rpcParsed.parsed.info, validator) as {
            authority: PublicKey;
            metadataAddress: PublicKey;
            mint: PublicKey;
        };

        expect(byteInfo.mint.equals(rpcInfo.mint)).toBe(true);
        expect(byteInfo.authority.equals(rpcInfo.authority)).toBe(true);
        expect(byteInfo.metadataAddress.equals(rpcInfo.metadataAddress)).toBe(true);
        expect(byteInfo.mint.equals(mint)).toBe(true);
    });

    test('should produce equivalent addresses for byte-parsed and RPC-parsed Associated Token createIdempotent paths', () => {
        const dispatcher = createInstructionParserDispatcher([associatedTokenInstructionParser]);

        const payer = Keypair.generate().publicKey;
        const ata = Keypair.generate().publicKey;
        const owner = Keypair.generate().publicKey;
        const mint = Keypair.generate().publicKey;
        const systemProgram = SystemProgram.programId;
        const tokenProgram = new PublicKey(TOKEN_PROGRAM_ADDRESS);
        const atProgramId = new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ADDRESS);

        // createIdempotent wire layout is a single discriminator byte (1); the
        // accounts are positional: [payer, ata, owner, mint, systemProgram, tokenProgram].
        const rawIx = new TransactionInstruction({
            data: Buffer.from([1]),
            keys: [payer, ata, owner, mint, systemProgram, tokenProgram].map(pubkey => ({
                isSigner: false,
                isWritable: false,
                pubkey,
            })),
            programId: atProgramId,
        });

        // Byte path: kit-shaped output with named `accounts`.
        const byteParsed = parseByteAtIdempotent(dispatcher.fromTransactionInstruction(rawIx));

        // RPC path: CreateIdempotentInfo shape.
        const rpcInput: ParsedInstruction = {
            parsed: {
                info: {
                    account: ata.toBase58(),
                    mint: mint.toBase58(),
                    source: payer.toBase58(),
                    systemProgram: systemProgram.toBase58(),
                    tokenProgram: tokenProgram.toBase58(),
                    wallet: owner.toBase58(),
                },
                type: 'createIdempotent',
            },
            program: 'spl-associated-token-account',
            programId: atProgramId,
        };
        const rpcParsed = dispatcher.fromParsedInstruction(rpcInput);
        const rpcInfo = create(rpcParsed.parsed.info, CreateIdempotentInfo);

        // Map byte `accounts.*` -> RPC info field names and assert agreement.
        expect(new PublicKey(byteParsed.accounts.payer.address).equals(rpcInfo.source)).toBe(true);
        expect(new PublicKey(byteParsed.accounts.ata.address).equals(rpcInfo.account)).toBe(true);
        expect(new PublicKey(byteParsed.accounts.owner.address).equals(rpcInfo.wallet)).toBe(true);
        expect(new PublicKey(byteParsed.accounts.mint.address).equals(rpcInfo.mint)).toBe(true);

        // And both describe the instruction we built.
        expect(rpcInfo.source.equals(payer)).toBe(true);
        expect(rpcInfo.account.equals(ata)).toBe(true);
        expect(rpcInfo.wallet.equals(owner)).toBe(true);
    });

    test('should pass through unchanged when no slice is registered', () => {
        const dispatcher = createInstructionParserDispatcher([]);
        const unknownProgram = Keypair.generate().publicKey;
        const rpcInput: ParsedInstruction = {
            parsed: { info: { foo: 'bar' }, type: 'unknown' },
            program: 'unknown-program',
            programId: unknownProgram,
        };

        const result = dispatcher.fromParsedInstruction(rpcInput);
        // Same reference: dispatcher returned the input untouched.
        expect(result).toBe(rpcInput);
    });

    test('should fall back to RPC value when slice rejects the type', () => {
        const dispatcher = createInstructionParserDispatcher([systemInstructionParser]);
        const rpcInput: ParsedInstruction = {
            parsed: { info: {}, type: 'someUnknownSystemInstructionType' },
            program: 'system',
            programId: SystemProgram.programId,
        };

        const result = dispatcher.fromParsedInstruction(rpcInput);
        expect(result).toBe(rpcInput);
    });

    test('should return undefined for fromTransactionInstruction when no parser registered', () => {
        const dispatcher = createInstructionParserDispatcher([]);
        const unknownProgram = Keypair.generate().publicKey;
        const ix = new TransactionInstruction({
            data: Buffer.from([1, 2, 3]),
            keys: [],
            programId: unknownProgram,
        });

        const result = dispatcher.fromTransactionInstruction(ix);
        expect(result).toBeUndefined();
    });

    test('should return UnparsedInstruction when parser exists but decode fails', () => {
        const dispatcher = createInstructionParserDispatcher([systemInstructionParser]);
        const ix = new TransactionInstruction({
            // Invalid System instruction data — slice's fromTransaction returns undefined.
            data: Buffer.from([255, 255, 255, 255]),
            keys: [],
            programId: SystemProgram.programId,
        });

        const result = dispatcher.fromTransactionInstruction(ix);
        if (isParsedInstruction(result) || !result) throw new Error('expected UnparsedInstruction');
        expect(result.unknown).toBe(true);
        expect(result.programLabel).toBe('system');
        expect(result.programId.equals(SystemProgram.programId)).toBe(true);
    });

    test('should report slice registration via canHandle without running the parser', () => {
        const dispatcher = createInstructionParserDispatcher([systemInstructionParser]);
        expect(dispatcher.canHandle(SystemProgram.programId.toBase58())).toBe(true);
        expect(dispatcher.canHandle(Keypair.generate().publicKey.toBase58())).toBe(false);
    });

    test('should throw on duplicate programId', () => {
        expect(() => createInstructionParserDispatcher([systemInstructionParser, systemInstructionParser])).toThrow(
            'duplicate parser',
        );
    });

    test('should decode a Lighthouse instruction via the byte path (no fromParsed)', () => {
        const dispatcher = createInstructionParserDispatcher([lighthouseInstructionParser]);
        // Bytes encode "Assert Sysvar Clock". Source: lighthouse card fixtures.
        const rawIx = new TransactionInstruction({
            data: Buffer.from([15, 0, 0, 166, 238, 134, 18, 0, 0, 0, 0, 3]),
            keys: [],
            programId: new PublicKey(LIGHTHOUSE_ADDRESS),
        });

        const byteParsed = dispatcher.fromTransactionInstruction(rawIx);
        if (!isParsedInstruction(byteParsed)) throw new Error('expected a ParsedInstruction');
        expect(byteParsed.program).toBe('lighthouse');
        expect(byteParsed.parsed.type).toBe('Assert Sysvar Clock');

        // Lighthouse is never RPC-pre-parsed, so the slice declares no fromParsed.
        expect(lighthouseInstructionParser.fromParsed).toBeUndefined();
    });
});

type AtAccount = { address: string };
type ByteAtIdempotentInfo = {
    accounts: { ata: AtAccount; mint: AtAccount; owner: AtAccount; payer: AtAccount };
};

function parseByteAtIdempotent(result: DispatchResult | undefined): ByteAtIdempotentInfo {
    if (!result || !isParsedInstruction(result)) {
        throw new Error('byte-parsed AT createIdempotent should be recognised');
    }
    return result.parsed.info as ByteAtIdempotentInfo;
}
