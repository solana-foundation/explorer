import {
    AccountMeta,
    MessageAddressTableLookup,
    MessageCompiledInstruction,
    PublicKey,
    TransactionInstruction,
    VersionedMessage,
} from '@solana/web3.js';

type LookupsForAccountKeyIndex = { lookupTableIndex: number, lookupTableKey: PublicKey }

function findLookupAddressByIndex(accountIndex: number, message: VersionedMessage, lookupsForAccountKeyIndex: LookupsForAccountKeyIndex[]){
    let lookup: PublicKey;
    // dynamic means that lookups are taken based not on staticAccountKeys
    let dynamicLookups: { isStatic: true, lookups: undefined} | { isStatic: false, lookups: LookupsForAccountKeyIndex };

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
){
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

export function findLookupAddress(accountIndex: number, message: VersionedMessage, lookupsForAccountKeyIndex: LookupsForAccountKeyIndex[]){
    return findLookupAddressByIndex(accountIndex, message, lookupsForAccountKeyIndex);
}

export function fillAddressTableLookupsAccounts(addressTableLookups: MessageAddressTableLookup[]){
    const lookupsForAccountKeyIndex: LookupsForAccountKeyIndex[]= [
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
    programId: PublicKey
): TransactionInstruction {
    const { accountKeyIndexes, data } = compiledInstruction;
    const { addressTableLookups } = originalMessage;

    const lookupAccounts = fillAddressTableLookupsAccounts(addressTableLookups);
    const accountMetas = fillAccountMetas(accountKeyIndexes, originalMessage, lookupAccounts);

    const transactionInstruction: TransactionInstruction = new TransactionInstruction({
        data: Buffer.from(data),
        keys: accountMetas,
        programId: programId,
    });

    return transactionInstruction;
}
