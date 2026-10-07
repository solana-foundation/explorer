import { addressFromSeed, blockhashFromSeed, signatureFromSeed } from '@explorer/utils/testing';
import { address } from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';

// Sysvars, the vote program and the wrapped-SOL mint have no @solana-program client here, so they stay literals.
export const gen = {
    address: addressFromSeed,
    blockhash: blockhashFromSeed,
    signature: signatureFromSeed,
    sysvarClock: address('SysvarC1ock11111111111111111111111111111111'),
    sysvarRent: address('SysvarRent111111111111111111111111111111111'),
    systemProgram: SYSTEM_PROGRAM_ADDRESS,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
    voteProgram: address('Vote111111111111111111111111111111111111111'),
    wrappedSol: address('So11111111111111111111111111111111111111112'),
};
