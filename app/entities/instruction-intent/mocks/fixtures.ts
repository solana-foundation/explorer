import { gen } from '@__fixtures__/gen';
import type { KitInstruction } from '@explorer/parsers';
import {
    AccountRole,
    type Address,
    address,
    getAddressEncoder,
    getU8Encoder,
    getU32Encoder,
    getU64Encoder,
    lamports,
    type MaybeEncodedAccount,
    type ReadonlyUint8Array,
} from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import type { RootNode } from 'codama';

import { concat } from '@/app/shared/lib/bytes';

import systemIdl from './codama/codama-1.0.0-11111111111111111111111111111111.json';
import tokenIdl from './codama/codama-1.0.0-TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA.json';

// The program addresses must match `program.publicKey` of the fixture IDLs, so they come from the program packages
export { SYSTEM_PROGRAM_ADDRESS, TOKEN_PROGRAM_ADDRESS };

export const SOURCE = address(gen.address(1));
export const DESTINATION = address(gen.address(2));
export const MINT = address(gen.address(3));
export const AUTHORITY = address(gen.address(4));

export const SYSTEM_ROOT = systemIdl as unknown as RootNode;
export const TOKEN_ROOT = tokenIdl as unknown as RootNode;
/** The Token root with every display node removed: a Codama IDL without intent templates. */
export const TOKEN_ROOT_WITHOUT_DISPLAY: RootNode = {
    ...TOKEN_ROOT,
    program: {
        ...TOKEN_ROOT.program,
        instructions: TOKEN_ROOT.program.instructions?.map(instruction => ({ ...instruction, display: undefined })),
    },
};

const MINT_SIZE = 82;

export function transferSolInstruction(amount = 1_500_000_000n): KitInstruction {
    return {
        accounts: [
            { address: SOURCE, role: AccountRole.WRITABLE_SIGNER },
            { address: DESTINATION, role: AccountRole.WRITABLE },
        ],
        data: withAmount(getU32Encoder().encode(2), amount),
        programAddress: SYSTEM_PROGRAM_ADDRESS,
    };
}

export function mintToInstruction(amount = 1_500_000n): KitInstruction {
    return {
        accounts: [
            { address: MINT, role: AccountRole.WRITABLE },
            { address: DESTINATION, role: AccountRole.WRITABLE },
            { address: AUTHORITY, role: AccountRole.READONLY_SIGNER },
        ],
        data: withAmount(getU8Encoder().encode(7), amount),
        programAddress: TOKEN_PROGRAM_ADDRESS,
    };
}

export function amountToUiAmountInstruction(): KitInstruction {
    return {
        accounts: [{ address: MINT, role: AccountRole.READONLY }],
        data: withAmount(getU8Encoder().encode(23), 1_500_000n),
        programAddress: TOKEN_PROGRAM_ADDRESS,
    };
}

export function unknownSystemInstruction(): KitInstruction {
    return { accounts: [], data: new Uint8Array(getU32Encoder().encode(99)), programAddress: SYSTEM_PROGRAM_ADDRESS };
}

export function mintAccount(decimals: number, address: Address = MINT): MaybeEncodedAccount {
    const data = new Uint8Array(MINT_SIZE);
    const view = new DataView(data.buffer);
    // SPL Token mint layout: authority option at 0, authority at 4, supply at 36, decimals at 44, initialized at 45
    view.setUint32(0, 1, true);
    data.set(getAddressEncoder().encode(AUTHORITY), 4);
    view.setBigUint64(36, 1_000_000_000n, true);
    data[44] = decimals;
    data[45] = 1;

    return {
        address,
        data,
        executable: false,
        exists: true,
        lamports: lamports(0n),
        programAddress: TOKEN_PROGRAM_ADDRESS,
        space: BigInt(MINT_SIZE),
    };
}

export function missingAccount(address: Address): MaybeEncodedAccount {
    return { address, exists: false };
}

function withAmount(discriminator: ReadonlyUint8Array, amount: bigint): Uint8Array {
    return concat([new Uint8Array(discriminator), new Uint8Array(getU64Encoder().encode(amount))]);
}
