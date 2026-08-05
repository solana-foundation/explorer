import { address, type Address } from '@solana/kit';

// Well-known placeholder addresses used across this package's specs. Only the default (system) program
// is needed today; no @solana-program/system dep here, so it stays a literal.
export const gen = {
    systemProgram: address('11111111111111111111111111111111'),
} satisfies Record<string, Address>;
