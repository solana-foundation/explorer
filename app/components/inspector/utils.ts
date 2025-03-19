import {
    AccountMeta,
    MessageAddressTableLookup,
    MessageCompiledInstruction,
    PublicKey,
    TransactionInstruction,
    VersionedMessage,
} from '@solana/web3.js';

type LookupsForAccountKeyIndex = { lookupTableIndex: number, lookupTableKey: PublicKey }

function findLookupAddressByIndex(accountIndex: number, message: VersionedMessage, lookupsForAccountKeyIndex: LookupsForAccountKeyIndex[]) {
    let lookup: PublicKey;
    // dynamic means that lookups are taken based not on staticAccountKeys
    let dynamicLookups: { isStatic: true, lookups: undefined } | { isStatic: false, lookups: LookupsForAccountKeyIndex };

    if (accountIndex >= message.staticAccountKeys.length) {
        const lookupIndex = accountIndex - message.staticAccountKeys.length;
        lookup = lookupsForAccountKeyIndex[lookupIndex].lookupTableKey;
        dynamicLookups = {
            isStatic: false,
            lookups: lookupsForAccountKeyIndex[lookupIndex]
        };
    } else {
        lookup = message.staticAccountKeys[accountIndex];
        dynamicLookups = {
            isStatic: true,
            lookups: undefined
        };
    }

    return { dynamicLookups, lookup };
}

function fillAccountMetas(
    accountKeyIndexes: number[],
    message: VersionedMessage,
    lookupsForAccountKeyIndex: LookupsForAccountKeyIndex[],
) {
    const accountMetas = accountKeyIndexes.map((accountIndex) => {
        const { lookup } = findLookupAddressByIndex(accountIndex, message, lookupsForAccountKeyIndex);

        const isSigner = accountIndex < message.header.numRequiredSignatures;
        const isWritable = message.isAccountWritable(accountIndex);
        const accountMeta: AccountMeta = {
            isSigner,
            isWritable,
            pubkey: lookup,
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
    originalMessage: VersionedMessage,
): TransactionInstruction {
    const { accountKeyIndexes, data } = compiledInstruction;
    const { addressTableLookups } = originalMessage;

    const lookupAccounts = fillAddressTableLookupsAccounts(addressTableLookups);

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
    if (!programId) throw new Error("Program ID not found");

    const accountMetas = fillAccountMetas(accountKeyIndexes, originalMessage, lookupAccounts);

    const transactionInstruction: TransactionInstruction = new TransactionInstruction({
        data: Buffer.from(data),
        keys: accountMetas,
        programId: programId,
    });

    return transactionInstruction;
}
