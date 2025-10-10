import { PublicKey } from '@solana/web3.js';

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

/**
 * Checks if a string is a valid Solana public key address
 * @param address - Address string to validate
 * @returns true if valid, false otherwise
 */
export function isValidSolanaAddress(address: string): boolean {
    try {
        new PublicKey(address);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validates that a string is a valid Solana public key address
 * @param address - Address string to validate
 * @throws ValidationError if address is invalid
 */
export function validateSolanaAddress(address: string): void {
    if (!isValidSolanaAddress(address)) {
        throw new ValidationError(`Invalid Solana address: ${address}`);
    }
}
