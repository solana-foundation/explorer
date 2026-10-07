import {
    address,
    type Address,
    bytesEqual,
    type CompiledTransactionMessage,
    type CompiledTransactionMessageWithLifetime,
    getBase58Decoder,
    getBase58Encoder,
    getBase64Encoder,
    getCompiledTransactionMessageDecoder,
    getCompiledTransactionMessageEncoder,
    getInstructionsFromCompiledTransactionMessage,
    getTransactionDecoder,
    isSolanaError,
    type ResolvedInstruction,
    SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_MASK_PRIORITY_FEE_BITS,
    SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED,
    type Transaction,
} from '@solana/kit';

import { type AccountResolutionResult, resolveAccounts } from './accounts.js';
import { fromRpcTransactionConfig, readTransactionConfig } from './config.js';
import {
    InvalidTransactionConfigError,
    MalformedTransactionError,
    UnsupportedTransactionVersionError,
} from './errors.js';
import type {
    AddressTableLookup,
    FromMessageOptions,
    ParsedTransaction,
    ReportedTransactionVersion,
    RpcJsonParsedTransaction,
    RpcJsonTransaction,
    RpcParsedInstruction,
    RpcTransactionResponse,
    TransactionAccount,
    TransactionInstruction,
    TransactionVersion,
} from './types.js';

const BASE58_DECODER = getBase58Decoder();
const BASE58_ENCODER = getBase58Encoder();
const BASE64_ENCODER = getBase64Encoder();

export function fromCompiledMessage(
    message: CompiledTransactionMessage & CompiledTransactionMessageWithLifetime,
    options: FromMessageOptions = {},
): ParsedTransaction {
    validateHeaderIntegrity(
        {
            numReadonlySignedAccounts: message.header.numReadonlySignerAccounts,
            numReadonlyUnsignedAccounts: message.header.numReadonlyNonSignerAccounts,
            numRequiredSignatures: message.header.numSignerAccounts,
        },
        message.staticAccounts.length,
    );

    const loadedAddresses = groupLoadedAddresses(options.loadedAddresses);
    const lookups = message.version === 0 ? toCompiledAddressTableLookups(message.addressTableLookups) : [];
    const resolved = resolveAccounts({
        addressTableLookups: message.version === 0 ? lookups : undefined,
        header: message.header,
        loadedAddresses,
        staticKeys: message.staticAccounts,
        version: message.version,
    });

    // kit rejects out-of-range indexes. Only v0 loads addresses, so kit sees the same account list as `resolved`.
    const kitInstructions = getInstructionsFromCompiledTransactionMessage(
        message,
        message.version === 0 ? loadedAddresses : undefined,
    );
    // kit account metas lack source and lookup table details. Reading by index keeps a repeated key's flags apart.
    const accountIndices = getInstructionAccountIndices(message);
    const instructions = kitInstructions.map((ix, i) =>
        toTransactionInstruction(ix, accountIndices[i], resolved.accounts),
    );

    return buildTransaction({
        config: readTransactionConfig(message),
        instructions,
        lookups,
        lifetimeSpecifier: message.lifetimeToken,
        resolved,
        signatures: options.signatures ?? [],
        version: message.version,
    });
}

export function fromMessageBytes(bytes: Uint8Array, options: FromMessageOptions = {}): ParsedTransaction {
    return fromCompiledMessage(decodeMessageBytes(bytes), options);
}

export function fromRpcTransaction(response: RpcTransactionResponse): ParsedTransaction {
    const loadedAddresses = response.meta?.loadedAddresses;
    const { transaction } = response;

    if ('message' in transaction) {
        const version = normalizeVersion(response.version);
        return isRpcJsonTransaction(transaction)
            ? fromJsonTransaction(transaction, version, loadedAddresses)
            : fromJsonParsedTransaction(transaction, version);
    }

    // Wire bytes carry their own version, so a response that reports none defers to them.
    const reportedVersion =
        response.version === undefined || response.version === null ? undefined : normalizeVersion(response.version);

    const [data, encoding] = transaction;
    // base64/base58 carry a full wire transaction, not a bare message.
    const encoder = encoding === 'base64' ? BASE64_ENCODER : BASE58_ENCODER;
    const wireBytes = new Uint8Array(tryRunDecode(() => encoder.encode(data)));
    const decoded = tryRunDecode(() => getTransactionDecoder().decode(wireBytes));
    const compiled = decodeMessageBytes(new Uint8Array(decoded.messageBytes));

    if (reportedVersion !== undefined && reportedVersion !== compiled.version) {
        throw new Error(
            `Transaction version mismatch: the response reports ${reportedVersion}, ` +
                `the bytes encode ${compiled.version}.`,
        );
    }

    return fromCompiledMessage(compiled, { loadedAddresses, signatures: toBase58Signatures(decoded.signatures) });
}

function decodeMessageBytes(bytes: Uint8Array): CompiledTransactionMessage & CompiledTransactionMessageWithLifetime {
    const compiled = tryRunDecode(() => getCompiledTransactionMessageDecoder().decode(bytes));

    // The message decoder ignores trailing bytes and can decode a truncated message. A round trip detects both.
    const encoded = getCompiledTransactionMessageEncoder().encode(compiled);
    if (!bytesEqual(encoded, bytes)) {
        throw new Error(
            `Transaction message bytes have trailing data or a non-canonical encoding: ` +
                `${bytes.length} bytes in, ${encoded.length} bytes re-encoded.`,
        );
    }

    return compiled;
}

function tryRunDecode<T>(decode: () => T): T {
    try {
        return decode();
    } catch (error) {
        if (isSolanaError(error, SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED)) {
            throw new UnsupportedTransactionVersionError(error.context.unsupportedVersion);
        }
        if (isSolanaError(error, SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_MASK_PRIORITY_FEE_BITS)) {
            throw new InvalidTransactionConfigError(`Invalid transaction config mask: ${error.context.mask}.`, {
                cause: error,
            });
        }
        throw new MalformedTransactionError('Transaction could not be decoded.', { cause: error });
    }
}

function toBase58Signatures(signatures: Transaction['signatures']): (string | undefined)[] {
    return Object.values(signatures).map(signature => (signature ? BASE58_DECODER.decode(signature) : undefined));
}

/**
 * Empty for legacy and v1.
 * Also empty for v0 when the response does not report the lookup tables.
 */
export function getAddressTableLookups(transaction: ParsedTransaction): readonly AddressTableLookup[] {
    return transaction.version === 0 ? (transaction.addressTableLookups ?? []) : [];
}

/**
 * True when the loaded addresses and the lookup table slots disagree, so the account list may not match the message.
 * Always false for legacy and v1, which cannot load addresses.
 */
export function hasUnmatchedLookupTables(transaction: ParsedTransaction): boolean {
    return (
        transaction.version === 0 &&
        (transaction.unmatchedLookupTableAddresses !== undefined ||
            transaction.unmatchedLookupTableIndexes !== undefined)
    );
}

export function isRpcParsedInstruction(instruction: TransactionInstruction): instruction is RpcParsedInstruction {
    return 'parsed' in instruction;
}

/** The RPC reports the version outside the message, so it is checked before the message is read. */
function normalizeVersion(version: ReportedTransactionVersion | undefined): TransactionVersion {
    if (version === 'legacy' || version === 0 || version === 1) return version;
    throw new UnsupportedTransactionVersionError(version);
}

function isRpcJsonTransaction(
    transaction: RpcJsonTransaction | RpcJsonParsedTransaction,
): transaction is RpcJsonTransaction {
    return 'header' in transaction.message;
}

function groupLoadedAddresses(
    loadedAddresses: FromMessageOptions['loadedAddresses'],
): { readonly: Address[]; writable: Address[] } | undefined {
    if (!loadedAddresses) return undefined;

    return {
        readonly: loadedAddresses.readonly.map(key => address(key)),
        writable: loadedAddresses.writable.map(key => address(key)),
    };
}

/**
 * Normalize field names:
 * - kit uses lookupTableAddress.
 * - RPC and this package use accountKey.
 */
function toCompiledAddressTableLookups(
    lookups:
        | readonly {
              lookupTableAddress: Address;
              readonlyIndexes: readonly number[];
              writableIndexes: readonly number[];
          }[]
        | undefined,
): AddressTableLookup[] {
    return (lookups ?? []).map(({ lookupTableAddress, readonlyIndexes, writableIndexes }) => ({
        accountKey: lookupTableAddress,
        readonlyIndexes,
        writableIndexes,
    }));
}

function toRpcAddressTableLookups(
    lookups: RpcJsonTransaction['message']['addressTableLookups'],
): AddressTableLookup[] | undefined {
    return lookups?.map(lookup => ({ ...lookup, accountKey: address(lookup.accountKey) }));
}

/** The account indexes of each instruction, in the order kit returns the instructions. */
function getInstructionAccountIndices(message: CompiledTransactionMessage): readonly (readonly number[])[] {
    return message.version === 1
        ? message.instructionPayloads.map(payload => payload.instructionAccountIndices)
        : message.instructions.map(ix => ix.accountIndices ?? []);
}

/** Maps one of kit's `ResolvedInstruction`s onto the TransactionInstruction shape. */
function toTransactionInstruction(
    ix: ResolvedInstruction,
    accountIndices: readonly number[],
    accounts: readonly TransactionAccount[],
): TransactionInstruction {
    return {
        accounts: accountIndices.map(index => accounts[index]),
        // Return consistent empty data, since kit omits it and json encodings keep it.
        data: new Uint8Array(ix.data ?? []),
        programAddress: ix.programAddress,
    };
}

/** jsonParsed names programs and accounts by address, so an address outside `accountKeys` is malformed input. */
function ensureAccountExists(byAddress: ReadonlyMap<Address, TransactionAccount>, key: Address): TransactionAccount {
    const account = byAddress.get(key);
    if (!account) throw new Error(`Account address not in the resolved account list: ${key}`);
    return account;
}

/**
 * Uses RPC header field names, so error messages stay stable for MCP payloads.
 * TODO(HOO-1670): delete the copy in entity-inspector's normalizer.ts once MCP validates through fromRpcTransaction.
 */
function validateHeaderIntegrity(header: RpcJsonTransaction['message']['header'], staticKeyCount: number): void {
    const { numReadonlySignedAccounts, numReadonlyUnsignedAccounts, numRequiredSignatures } = header;

    if (numRequiredSignatures <= 0 || numRequiredSignatures > staticKeyCount) {
        throw new Error(
            `numRequiredSignatures (${numRequiredSignatures}) out of range for ${staticKeyCount} account keys.`,
        );
    }

    if (numReadonlySignedAccounts < 0 || numReadonlyUnsignedAccounts < 0) {
        throw new Error(
            `negative readonly account count (signed=${numReadonlySignedAccounts}, ` +
                `unsigned=${numReadonlyUnsignedAccounts}).`,
        );
    }

    if (
        numReadonlySignedAccounts >= numRequiredSignatures ||
        numReadonlyUnsignedAccounts > staticKeyCount - numRequiredSignatures
    ) {
        throw new Error(
            `readonly counts (signed=${numReadonlySignedAccounts}, unsigned=${numReadonlyUnsignedAccounts}) ` +
                `exceed available accounts (signers=${numRequiredSignatures}, total=${staticKeyCount}).`,
        );
    }
}

function validateInstructionIndices(
    instructions: RpcJsonTransaction['message']['instructions'],
    accountKeyCount: number,
): void {
    for (const ix of instructions) {
        if (
            ix.programIdIndex < 0 ||
            ix.programIdIndex >= accountKeyCount ||
            ix.accounts.some(index => index < 0 || index >= accountKeyCount)
        ) {
            throw new Error(
                `instruction index out of bounds (programIdIndex=${ix.programIdIndex}, ` +
                    `accounts=[${ix.accounts.join(',')}], accountKeyCount=${accountKeyCount}).`,
            );
        }
    }
}

/**
 * Normalize JSON header naming and validate early.
 * Fail at the parse boundary before account or instruction resolution.
 */
function fromJsonTransaction(
    transaction: RpcJsonTransaction,
    version: TransactionVersion,
    loadedAddresses: FromMessageOptions['loadedAddresses'],
): ParsedTransaction {
    const { message } = transaction;
    const { accountKeys, header } = message;

    validateHeaderIntegrity(header, accountKeys.length);

    const resolvedHeader = {
        numReadonlyNonSignerAccounts: header.numReadonlyUnsignedAccounts,
        numReadonlySignerAccounts: header.numReadonlySignedAccounts,
        numSignerAccounts: header.numRequiredSignatures,
    };
    const lookups = version === 0 ? toRpcAddressTableLookups(message.addressTableLookups) : [];
    const resolved = resolveAccounts({
        addressTableLookups: version === 0 ? lookups : undefined,
        header: resolvedHeader,
        loadedAddresses: groupLoadedAddresses(loadedAddresses),
        staticKeys: accountKeys.map(key => address(key)),
        version,
    });

    validateInstructionIndices(message.instructions, resolved.accounts.length);

    const instructions = message.instructions.map(ix => ({
        accounts: ix.accounts.map(index => resolved.accounts[index]),
        data: new Uint8Array(BASE58_ENCODER.encode(ix.data)),
        programAddress: resolved.accounts[ix.programIdIndex].address,
    }));

    return buildTransaction({
        config: fromRpcTransactionConfig(message.transactionConfig),
        instructions,
        lookups,
        lifetimeSpecifier: message.recentBlockhash,
        resolved,
        signatures: [...transaction.signatures],
        version,
    });
}

/**
 * jsonParsed already resolves account roles, so header and index validation is not required.
 * It names the lookup tables, but not which table each loaded account came from.
 */
function fromJsonParsedTransaction(
    transaction: RpcJsonParsedTransaction,
    version: TransactionVersion,
): ParsedTransaction {
    const { message } = transaction;
    const lookups = version === 0 ? toRpcAddressTableLookups(message.addressTableLookups) : [];

    const accounts: TransactionAccount[] = message.accountKeys.map(key => ({
        address: address(key.pubkey),
        signer: key.signer,
        source: key.source === 'transaction' ? 'static' : 'lookupTable',
        writable: key.writable,
    }));
    const byAddress = new Map(accounts.map(account => [account.address, account] as const));

    const instructions: TransactionInstruction[] = message.instructions.map(ix => {
        const programAddress = ensureAccountExists(byAddress, address(ix.programId)).address;
        if ('parsed' in ix) return { parsed: ix.parsed, programAddress };

        return {
            accounts: ix.accounts.map(pubkey => ensureAccountExists(byAddress, address(pubkey))),
            data: new Uint8Array(BASE58_ENCODER.encode(ix.data)),
            programAddress,
        };
    });

    return buildTransaction({
        config: fromRpcTransactionConfig(message.transactionConfig),
        instructions,
        lookups,
        lifetimeSpecifier: message.recentBlockhash,
        resolved: { accounts },
        signatures: [...transaction.signatures],
        version,
    });
}

function buildTransaction(txData: {
    config: ReturnType<typeof readTransactionConfig>;
    instructions: TransactionInstruction[];
    /** `undefined` means the response did not report the tables. */
    lookups: readonly AddressTableLookup[] | undefined;
    lifetimeSpecifier: string;
    resolved: AccountResolutionResult;
    signatures: readonly (string | undefined)[];
    version: TransactionVersion;
}): ParsedTransaction {
    const base = {
        accounts: txData.resolved.accounts,
        instructions: txData.instructions,
        numSignerAccounts: txData.resolved.accounts.filter(account => account.signer).length,
        lifetimeSpecifier: txData.lifetimeSpecifier,
        signatures: txData.signatures,
    };

    if (txData.version === 0) {
        return {
            ...base,
            ...(txData.lookups !== undefined && { addressTableLookups: txData.lookups }),
            ...(txData.resolved.unmatchedLookupTableAddresses && {
                unmatchedLookupTableAddresses: txData.resolved.unmatchedLookupTableAddresses,
            }),
            ...(txData.resolved.unmatchedLookupTableIndexes && {
                unmatchedLookupTableIndexes: txData.resolved.unmatchedLookupTableIndexes,
            }),
            version: 0,
        };
    }
    if (txData.version === 1) return { ...base, version: 1, ...(txData.config && { config: txData.config }) };
    return { ...base, version: 'legacy' };
}
