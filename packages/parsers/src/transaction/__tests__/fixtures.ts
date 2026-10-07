import {
    AccountRole,
    type Address,
    appendTransactionMessageInstructions,
    blockhash,
    type CompiledTransactionMessage,
    type CompiledTransactionMessageWithLifetime,
    compileTransactionMessage,
    createTransactionMessage,
    getBase58Decoder,
    getBase58Encoder,
    getBase64Decoder,
    getCompiledTransactionMessageEncoder,
    getTransactionEncoder,
    type Instruction,
    pipe,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    type SignatureBytes,
    type Transaction,
    TRANSACTION_CONFIG_COMPUTE_UNIT_LIMIT_BIT_MASK,
    type V0CompiledTransactionMessage,
} from '@solana/kit';
import { getSetComputeUnitLimitInstruction } from '@solana-program/compute-budget';

import { gen } from '../../__tests__/gen.js';
import { fromCompiledMessage } from '../parse.js';
import type { ParsedTransaction, RpcJsonParsedTransaction, RpcJsonTransaction, TransactionVersion } from '../types.js';

const BLOCKHASH = { blockhash: blockhash(gen.blockhash(7)), lastValidBlockHeight: 100n } as const;
const FEE_PAYER = gen.address(1);
const PROGRAM_ADDRESS = gen.address(2);
const LOOKUP_TABLE_ADDRESS = gen.address(9);
const LOOKUP_TABLE_LOADED_ADDRESS = gen.address(10);
export const INSTRUCTION_DATA = new Uint8Array([1, 2, 3]);
const INSTRUCTION_DATA_BASE58 = 'Ldp';

type CompiledMessageFixture = CompiledTransactionMessage & CompiledTransactionMessageWithLifetime;
type MessageFixture = { compiled: CompiledMessageFixture; messageBytes: Uint8Array };

function compiledMessageFor(version: TransactionVersion): CompiledMessageFixture {
    const instruction: Instruction = { data: INSTRUCTION_DATA, programAddress: PROGRAM_ADDRESS };
    if (version !== 1) return compile(version, [instruction]);

    return compile(version, [
        { ...instruction, accounts: [{ address: FEE_PAYER, role: AccountRole.WRITABLE_SIGNER }] },
    ]);
}

function compile(version: TransactionVersion, instructions: readonly Instruction[]): CompiledMessageFixture {
    return compileTransactionMessage(
        pipe(
            createTransactionMessage({ version }),
            m => setTransactionMessageFeePayer(FEE_PAYER, m),
            m => setTransactionMessageLifetimeUsingBlockhash(BLOCKHASH, m),
            m => appendTransactionMessageInstructions(instructions, m),
        ),
    );
}

/** A v0 message with one address loaded from a lookup table, for a test that needs a real ALT entry. */
export function v0CompiledWithLookupTable(): MessageFixture & { loadedAddress: Address; lookupTableAddress: Address } {
    const compiled = compile(0, [
        {
            accounts: [
                {
                    address: LOOKUP_TABLE_LOADED_ADDRESS,
                    addressIndex: 0,
                    lookupTableAddress: LOOKUP_TABLE_ADDRESS,
                    role: AccountRole.WRITABLE,
                },
            ],
            data: INSTRUCTION_DATA,
            programAddress: PROGRAM_ADDRESS,
        },
    ]);

    return {
        ...withMessageBytes(compiled),
        loadedAddress: LOOKUP_TABLE_LOADED_ADDRESS,
        lookupTableAddress: LOOKUP_TABLE_ADDRESS,
    };
}

/** The fee payer at index 0 and again as a readonly key at index 2, with one instruction naming both. */
export function compiledWithDuplicateFeePayer(version: TransactionVersion): CompiledMessageFixture {
    const compiled = compiledMessageFor(version);
    const [feePayer, program] = compiled.staticAccounts;
    const header = { ...compiled.header, numReadonlyNonSignerAccounts: 2 };
    const staticAccounts = [feePayer, program, feePayer];

    if (compiled.version === 1) {
        const [instructionHeader] = compiled.instructionHeaders;
        const [instructionPayload] = compiled.instructionPayloads;
        return {
            ...compiled,
            header,
            instructionHeaders: [{ ...instructionHeader, numInstructionAccounts: 2 }],
            instructionPayloads: [{ ...instructionPayload, instructionAccountIndices: [0, 2] }],
            staticAccounts,
        };
    }

    return { ...compiled, header, instructions: [{ accountIndices: [0, 2], programAddressIndex: 1 }], staticAccounts };
}

/** A v0 message whose lookup table loads the fee payer again, with one instruction naming both copies. */
export function v0CompiledWithFeePayerInLUT(): {
    compiled: CompiledMessageFixture;
    loadedAddresses: { readonly: Address[]; writable: Address[] };
    lookupTableAddress: Address;
} {
    const compiled: CompiledTransactionMessageWithLifetime & V0CompiledTransactionMessage = {
        addressTableLookups: [{ lookupTableAddress: LOOKUP_TABLE_ADDRESS, readonlyIndexes: [], writableIndexes: [0] }],
        header: { numReadonlyNonSignerAccounts: 1, numReadonlySignerAccounts: 0, numSignerAccounts: 1 },
        instructions: [{ accountIndices: [0, 2], programAddressIndex: 1 }],
        lifetimeToken: BLOCKHASH.blockhash,
        staticAccounts: [FEE_PAYER, PROGRAM_ADDRESS],
        version: 0,
    };

    return {
        compiled,
        loadedAddresses: { readonly: [], writable: [FEE_PAYER] },
        lookupTableAddress: LOOKUP_TABLE_ADDRESS,
    };
}

/**
 * A message with `numSigners` required signers, built by hand since kit's compiler caps a message at 64 accounts.
 * The 128-signer boundary needs v0: in legacy, a first header byte of 128 or more reads as a version prefix.
 */
export function transactionWithSigners(version: 'legacy' | 0, numSigners: number): MessageFixture {
    const signers = Array.from({ length: numSigners }, (_, i) => gen.address(100 + i));
    const base = {
        header: { numReadonlyNonSignerAccounts: 1, numReadonlySignerAccounts: 0, numSignerAccounts: numSigners },
        instructions: [{ programAddressIndex: numSigners }],
        lifetimeToken: BLOCKHASH.blockhash,
        staticAccounts: [...signers, PROGRAM_ADDRESS],
    };

    return withMessageBytes(version === 0 ? { ...base, addressTableLookups: [], version } : { ...base, version });
}

export function legacyTransactionWithHeader(header: Partial<CompiledMessageFixture['header']>): MessageFixture {
    const base = compiledMessageFor('legacy');
    const compiled = { ...base, header: { ...base.header, ...header } };

    return {
        compiled,
        get messageBytes() {
            return encode(compiled);
        },
    };
}

function encode(compiled: CompiledTransactionMessage): Uint8Array {
    return new Uint8Array(getCompiledTransactionMessageEncoder().encode(compiled));
}

function withMessageBytes(compiled: CompiledMessageFixture): MessageFixture {
    return { compiled, messageBytes: encode(compiled) };
}

function transactionFixture(version: TransactionVersion) {
    return Object.assign(() => fromCompiledMessage(compiledMessageFor(version)), {
        compiled: () => compiledMessageFor(version),
        messageBytes: () => encode(compiledMessageFor(version)),
    });
}

export const legacyTransaction = transactionFixture('legacy');
export const v0Transaction = transactionFixture(0);
export const v1Transaction = transactionFixture(1);

type V1Config = {
    configMask: number;
    configValues: Extract<CompiledTransactionMessage, { version: 1 }>['configValues'];
};

/** Overrides a compiled v1 message's config, so a spec can express any mask. */
export function v1CompiledWithConfig(overrides: V1Config): CompiledMessageFixture {
    return { ...compiledMessageFor(1), ...overrides };
}

function computeUnitLimitConfig(computeUnitLimit: number): V1Config {
    return {
        configMask: TRANSACTION_CONFIG_COMPUTE_UNIT_LIMIT_BIT_MASK,
        configValues: [{ kind: 'u32', value: computeUnitLimit }],
    };
}

export function v1MessageBytesWithHalfSetPriorityFeeMask(): Uint8Array {
    return encode(v1CompiledWithConfig({ configMask: 0b01, configValues: [{ kind: 'u64', value: 1n }] }));
}

/** `undefined` produces a v1 message with no config at all, for the absent-limit fallback case. */
export function v1TransactionWithConfig(overrides: { computeUnitLimit: number } | undefined): ParsedTransaction {
    if (!overrides) return fromCompiledMessage(v1CompiledWithConfig({ configMask: 0, configValues: [] }));

    return fromCompiledMessage(v1CompiledWithConfig(computeUnitLimitConfig(overrides.computeUnitLimit)));
}

/** A transaction built from bare instructions. */
export function transactionWithInstructions(
    version: TransactionVersion,
    instructions: readonly Instruction[],
): ParsedTransaction {
    return fromCompiledMessage(compile(version, instructions));
}

export function v1TransactionWithLimitAndInstructions(
    computeUnitLimit: number,
    instructions: readonly Instruction[],
): ParsedTransaction {
    return fromCompiledMessage({ ...compile(1, instructions), ...computeUnitLimitConfig(computeUnitLimit) });
}

export function setComputeUnitLimit(units: number): Instruction {
    return getSetComputeUnitLimitInstruction({ units });
}

export function transferInstruction(): Instruction {
    return { data: INSTRUCTION_DATA, programAddress: gen.systemProgram };
}

/** A program outside the built-in-programs list, reserved at the 200k default. */
export function bpfInstruction(): Instruction {
    return { data: INSTRUCTION_DATA, programAddress: gen.address(30) };
}

export function jsonResponse(version: TransactionVersion = 1): {
    transaction: RpcJsonTransaction;
    version: TransactionVersion;
} {
    const compiled = compiledMessageFor(version);
    const [feePayer, program] = compiled.staticAccounts;

    return {
        transaction: {
            message: {
                accountKeys: [feePayer, program],
                header: {
                    numReadonlySignedAccounts: compiled.header.numReadonlySignerAccounts,
                    numReadonlyUnsignedAccounts: compiled.header.numReadonlyNonSignerAccounts,
                    numRequiredSignatures: compiled.header.numSignerAccounts,
                },
                instructions: [{ accounts: [0], data: INSTRUCTION_DATA_BASE58, programIdIndex: 1 }],
                recentBlockhash: compiled.lifetimeToken,
            },
            signatures: [gen.signature(1)],
        },
        version,
    };
}

/** An `encoding: 'jsonParsed'` response, built from the same compiled message fixtures. */
export function jsonParsedResponse(version: TransactionVersion = 1): {
    transaction: RpcJsonParsedTransaction;
    version: TransactionVersion;
} {
    const compiled = compiledMessageFor(version);
    const [feePayer, program] = compiled.staticAccounts;

    return {
        transaction: {
            message: {
                accountKeys: [
                    { pubkey: feePayer, signer: true, source: 'transaction' as const, writable: true },
                    { pubkey: program, signer: false, source: 'transaction' as const, writable: false },
                ],
                instructions: [{ accounts: [], data: INSTRUCTION_DATA_BASE58, programId: program }],
                recentBlockhash: compiled.lifetimeToken,
            },
            signatures: [gen.signature(1)],
        },
        version,
    };
}

/** What the RPC serves under `base64` and `base58`: the full wire transaction, message plus signatures. */
export function wireResponse(version: TransactionVersion = 1, encoding: 'base58' | 'base64' = 'base64') {
    return toWireResponse(version, signedByFeePayer(), encoding);
}

/** The same transaction with no signature filled in, which the wire carries as 64 zero bytes. */
export function unsignedWireResponse(version: TransactionVersion = 1) {
    // eslint-disable-next-line unicorn/no-null -- kit encodes a null signature as an empty slot
    return toWireResponse(version, { [FEE_PAYER]: null }, 'base64');
}

/** The signed wire bytes behind `wireResponse`, for a spec that corrupts them. */
export function wireBytes(version: TransactionVersion): Uint8Array {
    return toWireBytes(version, signedByFeePayer());
}

/** A `base64` response that reports no version, so the bytes alone decide it. */
export function base64WireResponse(bytes: Uint8Array) {
    return { transaction: [getBase64Decoder().decode(bytes), 'base64'] as const };
}

function signedByFeePayer(): Transaction['signatures'] {
    return { [FEE_PAYER]: getBase58Encoder().encode(gen.signature(1)) as SignatureBytes };
}

function toWireBytes(version: TransactionVersion, signatures: Transaction['signatures']): Uint8Array {
    const messageBytes = encode(compiledMessageFor(version)) as unknown as Transaction['messageBytes'];

    return new Uint8Array(getTransactionEncoder().encode({ messageBytes, signatures }));
}

function toWireResponse(
    version: TransactionVersion,
    signatures: Transaction['signatures'],
    encoding: 'base58' | 'base64',
) {
    const decoder = encoding === 'base64' ? getBase64Decoder() : getBase58Decoder();

    return { transaction: [decoder.decode(toWireBytes(version, signatures)), encoding] as const, version };
}
