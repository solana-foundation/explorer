import {
    AccountMeta,
    CompiledInstruction,
    MessageCompiledInstruction,
    MessageV0,
    ParsedInstruction,
    ParsedMessage,
    ParsedMessageAccount,
    ParsedTransaction,
    PartiallyDecodedInstruction,
    PublicKey,
    Transaction,
    TransactionInstruction,
    VersionedMessage,
    VersionedTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import { AccountRole, address, IAccountMeta } from 'web3js-experimental';

/**
 * @returns account data compatible with IAccountMeta interface
 */
export function upcastAccountMeta({ pubkey, isSigner, isWritable }: AccountMeta): IAccountMeta {
    return {
        address: address(pubkey.toBase58()),
        role: isSigner
            ? (isWritable
              ? AccountRole.WRITABLE_SIGNER
              : AccountRole.READONLY_SIGNER
              )
            : (isWritable
              ? AccountRole.WRITABLE
              : AccountRole.READONLY
            )
    };
}

/**
 * @returns TransactionInstruction with properties coerced as needed. Compatible with IInstruction interface
 */
export function upcastTransactionInstruction(ix: TransactionInstruction) {
    return {
        accounts: ix.keys.map(upcastAccountMeta),
        data: ix.data,
        programAddress: address(ix.programId.toBase58())
    };
}

/**
 * Performs backward conversion into TransactionInstruction.
 *
 * Currently is used for test purposes only
 */
function upcastMessageCompiledInstruction(ix: MessageCompiledInstruction, m: VersionedMessage): TransactionInstruction {
    let programIds;
    if ('programIds' in m) {
        programIds = m.accountKeys;
    } else {
        // take into account that we might have address of the lookup here instead of real program's address
        programIds = ([
            ...m.staticAccountKeys,
            ...m.addressTableLookups.flatMap((lookup) => [
                ...lookup.writableIndexes.map((index) => m.addressTableLookups[index].accountKey),
                ...lookup.readonlyIndexes.map((index) => m.addressTableLookups[index].accountKey)
            ])
        ]);
    }

    return {
        data: Buffer.from(ix.data),
        keys: ix.accountKeyIndexes.reduce((accountMetas, index) =>  accountMetas.concat([({
            isSigner: m.isAccountSigner(index),
            isWritable: m.isAccountWritable(index),
            pubkey: m.staticAccountKeys[index]
        })]), [] as AccountMeta[]),
        programId: programIds[ix.programIdIndex]
    };
}

/**
 * @returns ParsedMessageAccount which is collected based on transaction or lookupTable
 */

export function intoParsedMessageAccount(accountMeta: AccountMeta[]): ParsedMessageAccount[]
export function intoParsedMessageAccount(message: VersionedMessage): ParsedMessageAccount[]
export function intoParsedMessageAccount(messageOrAccountMeta: AccountMeta[] | VersionedMessage): ParsedMessageAccount[] {
    const fromAccountMeta = (a: AccountMeta): ParsedMessageAccount => ({
        pubkey: a.pubkey,
        signer: a.isSigner,
        source: 'transaction',
        writable: a.isWritable
    });

    const fromMessage = (accountKey: PublicKey, index: number, m: VersionedMessage, source?: ParsedMessageAccount['source'])=> {
        return {
            pubkey: accountKey,
            signer: m.isAccountSigner(index),
            source,
            writable: m.isAccountWritable(index)
        };
    };

    if (Array.isArray(messageOrAccountMeta)) {
        return messageOrAccountMeta.map(fromAccountMeta);
    } else if ('accountKeys' in messageOrAccountMeta) {
        return messageOrAccountMeta.accountKeys.reduce((keys, accountKey, index) => {
            keys.push(fromMessage(accountKey, index, messageOrAccountMeta, 'transaction'));
            return keys;
        }, [] as ParsedMessageAccount[]);
    } else if (messageOrAccountMeta.version === 0) {
        return messageOrAccountMeta.staticAccountKeys.reduce((keys, accountKey, index) => {
            keys.push(fromMessage(accountKey, index, messageOrAccountMeta, messageOrAccountMeta.addressTableLookups.some(({ accountKey: ak }) => ak.equals(accountKey)) ? 'lookupTable': 'transaction'));
            return keys;
        }, [] as ParsedMessageAccount[]);
    }
    throw new Error('Unsupported message type');
}

/**
 * @param data - allow to pass `any` to be able mock real data which can be seen on mainnet
 */
export interface ITransactionInstructionParser<TAdditionalData extends object> {
    (ti: TransactionInstruction, data?: TAdditionalData): ParsedInstruction | (ParsedInstruction & TAdditionalData)
}

/**
 * Performs parsing for TransactionInstruction.
 *
 * Should use program-specific parsing logic.
 * @param {TransactionInstruction} ix - instruction to parse data for
 * @param {TAdditionalData?} data - optional data that might be added into parsed data
 * @param {ITransactionInstructionParser} parse - parser that implements ITransactionInstructionParser interface
 * @returns ParsedInstruction for incoming TransactionInstruction
 */
export function intoParsedInstruction<TInstruction extends TransactionInstruction, TAdditionalData extends object>(ix: TInstruction, data: TAdditionalData | undefined, parse: ITransactionInstructionParser<TAdditionalData>): ReturnType<ITransactionInstructionParser<TAdditionalData>> {
    const parsedInstruction = parse(ix, data);

    return parsedInstruction;
}

/**
 * Convert CompiledInstructions in MessageV0 to ParsedInstruction[]
 * Note: Does not decode instruction data (data remains base58)
 * @param messageV0 - The MessageV0 object
 * @returns ParsedInstruction[]
 */
export function _parseCompiledInstructions(
  message: MessageV0
): ParsedInstruction[] {
  const accountKeys: PublicKey[] = [
    ...message.staticAccountKeys,
    ...message.addressTableLookups.flatMap((lookup) => [
      ...lookup.writableIndexes.map((i) => message.addressTableLookups[i]),
      ...lookup.readonlyIndexes.map((i) => message.addressTableLookups[i]),
    ]),
  ];

  return message.compiledInstructions.map((ix) => {
    const programId = accountKeys[ix.programIdIndex];

    const parsedIx: ParsedInstruction = {
      parsed: {},
      program: programId.toBase58(),
      programId,
    };

    return parsedIx;
  });
}

function intoPartiallyDecodedInstruction(ix: MessageCompiledInstruction | CompiledInstruction, parsedAccounts: ParsedMessageAccount[]): PartiallyDecodedInstruction {
    if ('accountKeyIndexes' in ix) {
        return {
            accounts: ix.accountKeyIndexes.reduce((acc, index) => {
                acc.push(parsedAccounts[index].pubkey);
                return acc;
            }, [] as PublicKey[]),
            data: bs58.encode(ix.data),
            programId: parsedAccounts[ix.programIdIndex].pubkey,
        };
    } else {
        return {
            accounts: ix.accounts.reduce((acc, index) => {
                acc.push(parsedAccounts[index].pubkey);
                return acc;
            }, [] as PublicKey[]),
            data: ix.data,
            programId: parsedAccounts[ix.programIdIndex].pubkey
        };
    }
}

export function intoParsedTransaction(transaction: VersionedTransaction | Transaction): ParsedTransaction {
    let parsedTransaction: ParsedTransaction;
    if ('compileMessage' in transaction) {
        // Transaction
        const message = transaction.compileMessage();
        const accountKeys = intoParsedMessageAccount(message);
        
        parsedTransaction = {
            message: {
                accountKeys,
                addressTableLookups: [],
                instructions: message.instructions.map((ix) => {
                    return intoPartiallyDecodedInstruction(ix, accountKeys);
                }),
                recentBlockhash: message.recentBlockhash
            },
            signatures: transaction.signatures
                .map(a => a.signature !== null ? bs58.encode(a.signature) : null)
                .filter<string>((a): a is string => a != null)
        };
    } else {
        // VersionedTransaction
        const { signatures } = transaction;

        if ('accountKeys' in transaction.message) {
            const { message } = transaction;
            const accountKeys = intoParsedMessageAccount(message);
            parsedTransaction = {
                message: {
                    accountKeys,
                    addressTableLookups: message.addressTableLookups,
                    instructions: message.instructions.map((ix) => {
                        return intoPartiallyDecodedInstruction(ix, accountKeys);
                    }),
                    recentBlockhash: message.recentBlockhash
                },
                signatures: signatures.map(bs58.encode)
            };
        } else if (transaction.message.version === 0) {
            const { message } = transaction;
            const accountKeys = intoParsedMessageAccount(message);

            parsedTransaction = {
                message: {
                    accountKeys,
                    addressTableLookups: message.addressTableLookups,
                    instructions: message.compiledInstructions.map((ix) => {
                        // use  PartiallyDecoded format as Transaction might contain instructions from different programs
                        // NOTE: might be usefull to adopt parse mechanism in future. skip for now
                        return intoPartiallyDecodedInstruction(ix, accountKeys);
                    }),
                    recentBlockhash:message.recentBlockhash
                },
                signatures: signatures.map(bs58.encode)
            };
        } else {
            throw new Error('Unsupported transaction version');
        }
    }

    return parsedTransaction;
}

/**
 *  Builds ParsedTransaction from single versioned message
 *  @returns ParsedTransaction
 */
export function intoParsedTransactionFromMessage(message: VersionedMessage): ParsedTransaction {
    const vt = new VersionedTransaction(message);
    return intoParsedTransaction(vt);
}

/**
 * Extracts transaction signatures from VersionedTransaction or Transaction and makes a conversion into string
 * @returns string[]
 */
function parseTransactionSignatures(t: VersionedTransaction | Transaction): string[] {
    if ('compileMessage' in t) {
        return t.signatures.map(a => a.signature !== null ? bs58.encode(a.signature) : null).filter<string>((a): a is string => a != null);
    } else {
        return t.signatures.map(bs58.encode);
    }
}

/**
 * Interface compatible with ParsedTransaction
 *
 * It containts message with only one instruction.
 * That is needed to display instruction data properly with UI compatible with ParsedTransaction
 */
type ElementType<T> = T extends (infer U)[]? U : T;
interface PartialParsedTransaction extends ParsedTransaction {
    message: Omit<ParsedMessage, 'instructions'> & {
        instructions: [ElementType<ParsedMessage['instructions']>]
    }
}

/**
 * Performs conversion of VersionedTransaction or Transaction to PartialParsedTransaction
 * @param {VersionedTransaction | Transaction} t - incoming transaction
 * @param {number} index - position of instruction to wrap with PartialParsedTransaction
 * @returns PartialParsedTransaction
 */
export function intoPartialParsedTransaction<TAdditionalData extends object>(t: VersionedTransaction | Transaction, index: number, parse: ITransactionInstructionParser<TAdditionalData>, data?: TAdditionalData): PartialParsedTransaction {
    function assertInstruction(ix?: TransactionInstruction | MessageCompiledInstruction): void {
        if (!ix) throw new Error('Cannot find instruction by index');
    }

    const signatures = parseTransactionSignatures(t);
    if ('compileMessage' in t) {
        // Transaction
        const ix = t.instructions[index];
        const message = t.compileMessage();
        assertInstruction(ix);
        return intoPartialParsedTransactionFromTransactionInstruction(ix, message, signatures, parse, data);
    } else {
        // VersionedTransaction
        const ix = t.message.compiledInstructions[index];
        assertInstruction(ix);
        return intoPartialParsedTransactionFromTransactionInstruction(ix as any, t.message, signatures, parse, data);
    }
}

/**
 * Performs conversion of TransactionInstruction to PartialParsedTransaction
 * @param {TransactionInstruction | MessageCompiledInstruction} ix - instruction to parse
 * @param {Message | VersionedMessage} m - compiled message from Transaction or versioned message which VersionedTransaction contains
 * @param {SignaturePubkeyPair[] | Uint8Array[]} signatures - signatures that present at the transaction
 * @param {ITransactionInstructionParser<TAdditionalData>} parse - parser to convert instruction data into human-readable format
 * @param {TAdditionalData?} data - optional additional data that might be added into parsed instruction data
 * @returns PartialParsedTransaction
 */
export function intoPartialParsedTransactionFromTransactionInstruction<TAdditionalData extends object>(ix: TransactionInstruction/* | MessageCompiledInstruction*/, m: VersionedMessage, signatures: string[], parse: ITransactionInstructionParser<TAdditionalData>, data?: TAdditionalData): PartialParsedTransaction {
    const { addressTableLookups, recentBlockhash } = m;
    if ('keys' in ix) {
        // TransactionInstruction
        return {
            message: {
                accountKeys: intoParsedMessageAccount(m),
                addressTableLookups,
                instructions: [intoParsedInstruction(ix, data, parse)],
                recentBlockhash
            },
            signatures
        };
    } else {
        // VersionedTransaction
        return {
            message: {
                accountKeys: intoParsedMessageAccount(m),
                addressTableLookups,
                // TODO: cover branch for MessageCompiledInstruction
                instructions: [intoParsedInstruction(ix as any, data, parse)],
                recentBlockhash
            },
            signatures
        };
    }
}

export const privateUpcastMessageCompiledInstruction = upcastMessageCompiledInstruction;
