import {
    AccountMeta,
    ParsedInstruction,
    ParsedTransaction,
    Transaction,
    TransactionInstruction,
    VersionedMessage,
} from '@solana/web3.js';
import { AccountRole, address, IAccountMeta } from 'web3js-experimental';

/**
 * @returns - account data compatible with IAccountMeta interface
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
 * @returns - TransactionInstruction with properties coerced as needed. Compatible with IInstruction interface
 */
export function upcastTransactionInstruction(ix: TransactionInstruction) {
    return {
        accounts: ix.keys.map(upcastAccountMeta),
        data: ix.data,
        programAddress: address(ix.programId.toBase58())
    };
}

/**
 * @param data - allow to pass `any` to be able mock real data which can be seen on mainnet
 */
export interface ITransactionInstructionParser<TAdditionalData extends object> {
    (ti: TransactionInstruction, data?: TAdditionalData): ParsedInstruction | (ParsedInstruction & TAdditionalData)
}

/**
 * @returns - ParsedInstruction for incoming TransactionInstruction
 */
export function intoParsedInstruction<TInstruction extends TransactionInstruction, TAdditionalData extends object>(instruction: TInstruction, data: TAdditionalData | undefined, parse: ITransactionInstructionParser<TAdditionalData>): ReturnType<ITransactionInstructionParser<TAdditionalData>> {
    const parsedInstruction = parse(instruction, data);

    return parsedInstruction;
}

function intoParsedTransaction(transactionOrVersionedMessage: VersionedMessage | Transaction): ParsedTransaction {
    let parsedTransaction: ParsedTransaction;
    if ('compileMessage' in transactionOrVersionedMessage) {
        // Transaction
        console.log(transactionOrVersionedMessage);
        throw new Error('Not implemented');
    } else {
        console.log(transactionOrVersionedMessage);

        parsedTransaction = {};
    }

    return parsedTransaction;
}
export { intoParsedTransaction };

