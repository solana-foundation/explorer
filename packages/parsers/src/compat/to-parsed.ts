import {
    type AccountMeta as LegacyAccountMeta,
    type ParsedMessage,
    type ParsedMessageAccount,
    type ParsedTransaction,
    type TransactionInstruction,
    type VersionedMessage,
} from '@solana/web3.js';

// Synthetic ParsedTransaction wrapper for cards that take a `tx: ParsedTransaction` prop.
export function toParsedTransaction(
    ix: TransactionInstruction,
    message: VersionedMessage,
    instructions: ParsedMessage['instructions'] = [],
    signatures: string[] = [],
): ParsedTransaction {
    return {
        message: {
            accountKeys: convertAccountKeysToParsedMessageAccounts(ix.keys),
            addressTableLookups: message.addressTableLookups,
            instructions,
            recentBlockhash: message.recentBlockhash,
        },
        signatures,
    };
}

function convertAccountKeysToParsedMessageAccounts(keys: LegacyAccountMeta[]): ParsedMessageAccount[] {
    return keys.map(
        (key): ParsedMessageAccount => ({
            pubkey: key.pubkey,
            signer: key.isSigner,
            // A bare `TransactionInstruction.keys` entry carries no provenance, so
            // we can't tell static from lookup-table-loaded accounts here. Default
            // to 'transaction' (the honest default) rather than mislabelling static
            // keys as 'lookupTable'.
            source: 'transaction',
            writable: key.isWritable,
        }),
    );
}
