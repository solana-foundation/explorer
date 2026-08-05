import { address, type Address } from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';

// Well-known addresses used as placeholders across this package's specs. Program addresses come
// from their @solana-program client; sysvars and the wrapped-SOL mint have no such dep, so they stay literals.
export const gen = {
    sysvarClock: address('SysvarC1ock11111111111111111111111111111111'),
    sysvarRent: address('SysvarRent111111111111111111111111111111111'),
    systemProgram: SYSTEM_PROGRAM_ADDRESS,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
    voteProgram: address('Vote111111111111111111111111111111111111111'),
    wrappedSol: address('So11111111111111111111111111111111111111112'),
} satisfies Record<string, Address>;
