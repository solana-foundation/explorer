import {
    AccountMeta,
    MessageAccountKeys,
    MessageAddressTableLookup,
    MessageCompiledInstruction,
    PublicKey,
    TransactionInstruction,
    VersionedMessage,
} from '@solana/web3.js';

type LookupsForAccountKeyIndex = { lookupTableIndex: number; lookupTableKey: PublicKey };
type DynamicLookups = { isStatic: true; lookups: undefined } | { isStatic: false; lookups: LookupsForAccountKeyIndex };

function findLookupAddressByIndex(accountIndex: number, message: VersionedMessage, lookupsForAccountKeyIndex: LookupsForAccountKeyIndex[]): DynamicLookups {
    if (accountIndex >= message.staticAccountKeys.length) {
        const lookupIndex = accountIndex - message.staticAccountKeys.length;

        return {
            isStatic: false,
            lookups: lookupsForAccountKeyIndex[lookupIndex],
        };
    } else {
        return {
            isStatic: true,
            lookups: undefined,
        };
    }
}

function fillAccountMetas(accountKeyIndexes: number[], message: VersionedMessage) {
    const accountMetas = accountKeyIndexes.map(accountIndex => {
        const pubkey = messageAccountKeys.get(accountIndex)!;
        const isSigner = accountIndex < message.header.numRequiredSignatures;
        const isWritable = message.isAccountWritable(accountIndex);
        const accountMeta: AccountMeta = {
            isSigner,
            isWritable,
            pubkey,
        };

        return accountMeta;
    });

    return accountMetas;
}

export function findLookupAddress(accountIndex: number, message: VersionedMessage, lookupsForAccountKeyIndex: LookupsForAccountKeyIndex[]) {
    return findLookupAddressByIndex(accountIndex, message, lookupsForAccountKeyIndex);
}

export function fillAddressTableLookupsAccounts(addressTableLookups: MessageAddressTableLookup[]) {
    const lookupsForAccountKeyIndex: LookupsForAccountKeyIndex[] = [
        ...addressTableLookups.flatMap(lookup =>
            lookup.writableIndexes.map(index => ({
                lookupTableIndex: index,
                lookupTableKey: lookup.accountKey,
            }))
        ),
        ...addressTableLookups.flatMap(lookup =>
            lookup.readonlyIndexes.map(index => ({
                lookupTableIndex: index,
                lookupTableKey: lookup.accountKey,
            }))
        ),
    ];

    return lookupsForAccountKeyIndex;
}

export function intoTransactionInstructionFromVersionedMessage(
    compiledInstruction: MessageCompiledInstruction,
    originalMessage: VersionedMessage
): TransactionInstruction {
    const { accountKeyIndexes, data } = compiledInstruction;
    const { addressTableLookups } = originalMessage;

    // When we're deserializing Squads vault transactions, an "outer" programIdIndex can be found in the addressTableLookups
    // (You never need to lookup outer programIds for normal messages)
    let programId: PublicKey | undefined;
    if (compiledInstruction.programIdIndex < originalMessage.staticAccountKeys.length) {
        programId = originalMessage.staticAccountKeys.at(compiledInstruction.programIdIndex);
    } else {
        // This is only needed for Squads vault transactions, in normal messages, outer program IDs cannot be in addressTableLookups
        const lookupIndex = compiledInstruction.programIdIndex - originalMessage.staticAccountKeys.length;
        programId = addressTableLookups[lookupIndex].accountKey;
    }
    if (!programId) throw new Error('Program ID not found');

    // How do we get the ALTs here? This is not a component
    const accountMetas = fillAccountMetas(accountKeyIndexes, originalMessage);

    const transactionInstruction: TransactionInstruction = new TransactionInstruction({
        data: Buffer.from(data),
        keys: accountMetas,
        programId: programId,
    });

    return transactionInstruction;
}
