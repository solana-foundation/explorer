import type { Address, ReadonlyUint8Array } from '@solana/kit';
import { NATIVE_MINT } from '@solana/spl-token';
import { identifyTokenAccount, TOKEN_PROGRAM_ADDRESS, TokenAccount } from '@solana-program/token';
import { identifyToken2022Account, TOKEN_2022_PROGRAM_ADDRESS, Token2022Account } from '@solana-program/token-2022';

export { Token2022Account, TokenAccount };

export const NATIVE_MINT_ADDRESS = NATIVE_MINT.toBase58();

export function isNativeMint(mint: Address | string): boolean {
    return mint === NATIVE_MINT_ADDRESS;
}

export function isTokenMintByOwner(owner: Address, data?: ReadonlyUint8Array): boolean {
    if (owner !== TOKEN_PROGRAM_ADDRESS && owner !== TOKEN_2022_PROGRAM_ADDRESS) {
        return false;
    }
    if (data) {
        const type = identifyTokenAccountType(owner, data);
        return type === TokenAccount.Mint || type === Token2022Account.Mint;
    }
    return true;
}

export function identifyTokenAccountType(
    owner: Address,
    data: ReadonlyUint8Array,
): TokenAccount | Token2022Account | undefined {
    try {
        if (owner === TOKEN_PROGRAM_ADDRESS) {
            return identifyTokenAccount(data);
        }
        if (owner === TOKEN_2022_PROGRAM_ADDRESS) {
            return identifyToken2022Account(data);
        }
    } catch {
        return undefined;
    }
    return undefined;
}
