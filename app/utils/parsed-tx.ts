import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import {
    AccountMeta,
    Message,
    MessageV0,
    ParsedInstruction,
    ParsedMessageAccount,
    ParsedTransaction,
    PublicKey,
    Transaction,
    TransactionInstruction,
    VersionedMessage,
    VersionedTransaction,
} from '@solana/web3.js';
import { Account, AccountRole, address, IAccountMeta } from 'web3js-experimental';

import { fromProgramData } from './security-txt';

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
 * @returns ParsedInstruction for incoming TransactionInstruction
 */
export function intoParsedInstruction<TInstruction extends TransactionInstruction, TAdditionalData extends object>(instruction: TInstruction, data: TAdditionalData | undefined, parse: ITransactionInstructionParser<TAdditionalData>): ReturnType<ITransactionInstructionParser<TAdditionalData>> {
    const parsedInstruction = parse(instruction, data);

    return parsedInstruction;
}

/**
 * Convert CompiledInstructions in MessageV0 to ParsedInstruction[]
 * Note: Does not decode instruction data (data remains base58)
 * @param messageV0 - The MessageV0 object
 * @returns ParsedInstruction[]
 */
export function parseCompiledInstructions(
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
      programId,
      program: programId.toBase58(),
      parsed: {},
    };

    return parsedIx;
  });
}

export function intoParsedTransaction(transaction: VersionedTransaction | Transaction): ParsedTransaction {
    let parsedTransaction: ParsedTransaction;
    if ('compileMessage' in transaction) {
        // Transaction
        // NOTE: this branch should be implemented as we'll need implementation for transaction parsing

        //parsedTransaction = {
            //message: {},
            //signatures: signatures.map(a => a.signature !== null ? bs58.encode(a.signature) : null).filter<string>((a): a is string => a != null)
        //};
        throw new Error('Not implemented');
    } else {
        // VersionedTransaction
        console.log(123, { transaction });
        const { signatures } = transaction;

        if ('accountKeys' in transaction.message) {
            const { message } = transaction;
            parsedTransaction = {
                message: {
                    accountKeys: intoParsedMessageAccount(message),
                    addressTableLookups: message.addressTableLookups,
                    instructions: message.instructions,
                    recentBlockhash: message.recentBlockhash
                },
                signatures: signatures.map(bs58.encode)
            };
        } else if (transaction.message.version === 0) {

        } else {
            throw new Error('Unsupported transaction version');
        }

    }

    return parsedTransaction;
}

export function intoParsedTransactionFromMessage(message: VersionedMessage): ParsedTransaction {
    const vt = new VersionedTransaction(message);
    const pt = intoParsedTransaction(vt);

    return pt;
}
