import type { CompiledInnerInstruction } from '@solana/web3.js';
import { MessageV0, PublicKey } from '@solana/web3.js';

const SYSTEM_PROGRAM = new PublicKey('11111111111111111111111111111111');
const TOKEN_PROGRAM = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ATA_PROGRAM = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const COMPUTE_BUDGET_PROGRAM = new PublicKey('ComputeBudget111111111111111111111111111111');
const ZK_ELGAMAL_PROOF_PROGRAM = new PublicKey('ZkE1Gama1Proof11111111111111111111111111111');
const PYTH_PROGRAM = new PublicKey('FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH');
const MEMO_PROGRAM = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
const ADDRESS_LOOKUP_TABLE_PROGRAM = new PublicKey('AddressLookupTab1e1111111111111111111111111');

// The account list of the transaction in HOO-611, in wire order. Keys 9 to 12 are added, so an inner
// instruction can call more programs.
export const ACCOUNT_KEYS = [
    new PublicKey('37vWB5RfLRpnhNobhzmwCRGZbynGd4je2NvppSjUsEdJ'), // 0 fee payer
    new PublicKey('4aa42XQFo45wc2PHQH21vahuyuFYCEZAH4G27xpGYqf6'), // 1 source token account
    new PublicKey('CFRWXYp8zc2ftkF2Bv8jXmQu1qW67goZjSkKMjv6UV3P'), // 2 associated token account
    SYSTEM_PROGRAM, // 3
    new PublicKey('AGRidUXLeDij9CJprkZx7WBXtTQC67jtfiwz293mVrJ'), // 4 mint
    COMPUTE_BUDGET_PROGRAM, // 5
    TOKEN_PROGRAM, // 6
    new PublicKey('97PALEbpPj7muiQqi2HXS8QukLsrrr1yfgKfvXjWtsUG'), // 7 wallet
    ATA_PROGRAM, // 8
    ZK_ELGAMAL_PROOF_PROGRAM, // 9
    PYTH_PROGRAM, // 10
    MEMO_PROGRAM, // 11
    ADDRESS_LOOKUP_TABLE_PROGRAM, // 12
];

/** System CreateAccount of the associated token account, as the RPC encodes it. */
export const CREATE_ACCOUNT = {
    accounts: [0, 2],
    data: '11119os1e9qSs2u7TsThXqkBSRVFxhmYaFKFZ1waB2X7armDmvK3p5GmLdUxYdg3h7QSrL',
    programIdIndex: 3,
};

// The four CPIs the RPC reports for the Create Idempotent instruction, verbatim
// from `getTransaction`: GetAccountDataSize, CreateAccount, InitializeImmutableOwner,
// InitializeAccount3.
export const INNER_INSTRUCTIONS: CompiledInnerInstruction[] = [
    {
        index: 0,
        instructions: [
            { accounts: [4], data: '84eT', programIdIndex: 6 },
            CREATE_ACCOUNT,
            { accounts: [2], data: 'P', programIdIndex: 6 },
            { accounts: [2, 4], data: '6VF5qGS8cgaPcBCWMoBUrv6rJFETgGbHgNbVXR7RLC1uE', programIdIndex: 6 },
        ],
    },
];

// A single Create Idempotent instruction over the account list above. The real transaction has two
// more top-level instructions, and neither has inner instructions.
export function buildMessage(): MessageV0 {
    return new MessageV0({
        addressTableLookups: [],
        compiledInstructions: [{ accountKeyIndexes: [0, 2, 7, 4, 3, 6], data: new Uint8Array([1]), programIdIndex: 8 }],
        header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 10, numRequiredSignatures: 1 },
        recentBlockhash: new PublicKey(new Uint8Array(32)).toBase58(),
        staticAccountKeys: ACCOUNT_KEYS,
    });
}
