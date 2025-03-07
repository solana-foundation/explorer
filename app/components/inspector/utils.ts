import * as spl from '@solana/spl-token';
import {
    AccountMeta,
    MessageAddressTableLookup,
    MessageCompiledInstruction,
    ParsedInstruction,
    ParsedMessage,
    ParsedMessageAccount,
    ParsedTransaction,
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
): TransactionInstruction {
    const { accountKeyIndexes, data } = compiledInstruction;
    const { addressTableLookups } = originalMessage;

    const programId = originalMessage.staticAccountKeys.at(compiledInstruction.programIdIndex);

    if (!programId) throw new Error("Program ID not found");

    const lookupAccounts = fillAddressTableLookupsAccounts(addressTableLookups);
    const accountMetas = fillAccountMetas(accountKeyIndexes, originalMessage, lookupAccounts);

    const transactionInstruction: TransactionInstruction = new TransactionInstruction({
        data: Buffer.from(data),
        keys: accountMetas,
        programId: programId,
    });

    return transactionInstruction;
}

/**
 * entity that performs conversion from TransactionInstruction that is created from VersionedMessage into ParsedInstruction.
 *
 *  That is needed for backward compatibility with existing InstructionCards that expect ParsedInstruction for rendering.
 *
 *  This is temporary solution to reuse existing cards at the Inspector. Might pivot to a better solution in future.
 */
export function ParsedInstructionFactory(){
    function intoProgramName(programId: PublicKey): string | undefined {
        if (programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)) {
            return 'spl-associated-token-account';
        }
    }

    function intoParsedData(instruction: TransactionInstruction, parsed: any): any{
        const { programId, data } = instruction;
        const info = parsed ?? {};

        // Temporary keep enums hardcoded.
        // TODO: find better way to keep these enums in sync with core repositories
        const CREATE_BUFFER_EMPTY = Buffer.from('');
        const CREATE_BUFFER = Buffer.from('\x00');
        const CREATE_IDEMPOTENT_BUFFER = Buffer.from('\x01');
        const CREATE_RECOVER_NESTED_BUFFER = Buffer.from('\x02');

        if (programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)) {
            let type;
            if (data.equals(CREATE_BUFFER)) type = 'create';
            else if (data.equals(CREATE_BUFFER_EMPTY)) type = 'create';
            else if (data.equals(CREATE_IDEMPOTENT_BUFFER)) type = 'createIdempotent';
            else if (data.equals(CREATE_RECOVER_NESTED_BUFFER)) type ='recoverNested';
            else type = '';

            return {
                info,
                type
            };
        }

        return {
            info,
            type: '' // empty string represents that the program was unknown
        };
    }

    function getInstructionData(instruction: TransactionInstruction, data: any){
        const program = intoProgramName(instruction.programId);
        const parsed = intoParsedData(instruction, data);

        return { parsed, program };
    }

    function convertAccountKeysToParsedMessageAccounts(keys: AccountMeta[]): ParsedMessageAccount[]{
        const accountKeys= keys.map((key): ParsedMessageAccount => {
            return {
                pubkey: key.pubkey,
                signer: key.isSigner,
                source: 'lookupTable',
                writable: key.isWritable
            };
        });

        return accountKeys;
    }

    return {
        /**
         * parsed - allow to pass any data as we can not recover parsed data
         */
        intoParsedInstruction(transactionInstruction: TransactionInstruction, data: any = {}): ParsedInstruction {
            const { programId } = transactionInstruction;
            const { program, parsed } = getInstructionData(transactionInstruction, data);

            return {
                parsed,
                program: program ?? '',
                programId
            };
        },
        intoParsedTransaction(transactionInstruction: TransactionInstruction, versionedMessage: VersionedMessage): ParsedTransaction {
            const { keys } = transactionInstruction;
            const { addressTableLookups, recentBlockhash } = versionedMessage;

            const parsedMessage: ParsedMessage = {
                accountKeys: convertAccountKeysToParsedMessageAccounts(keys),
                addressTableLookups,
                // at this moment we do not parse instructions as they are not required to represent the transaction. that's why array is empty
                instructions: [],
                recentBlockhash
            };

            return {
                message: parsedMessage,
                signatures: [],
            };
        }
    };
}
