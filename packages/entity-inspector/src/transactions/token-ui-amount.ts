// Human-readable amount for the token "checked" instructions — they carry `decimals` in their own
// args, so no mint read is needed. Within the two token programs, args holding BOTH amount and
// decimals is exactly that family (initializeMint has decimals but no amount, amountToUiAmount the
// reverse), which is why the gate needs no instruction-name list.
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '../shared/constants.js';

function readCheckedAmount(info: unknown): { amount: bigint; decimals: number } | undefined {
    if (typeof info !== 'object' || info === null || !('amount' in info) || !('decimals' in info)) {
        return undefined;
    }
    const { amount, decimals } = info;
    if (typeof decimals !== 'number' || !Number.isInteger(decimals) || decimals < 0) {
        return undefined;
    }
    if (typeof amount === 'bigint') {
        return { amount, decimals };
    }
    // a swapped decode engine may hand back the u64 already stringified
    if (typeof amount === 'string' && /^\d+$/.test(amount)) {
        return { amount: BigInt(amount), decimals };
    }
    return undefined;
}

// Decimal-shifted over BigInt, never float division — a u64 amount outruns Number's exact range.
function formatUiAmount(amount: bigint, decimals: number): string {
    if (decimals === 0) {
        return amount.toString();
    }
    const digits = amount.toString().padStart(decimals + 1, '0');
    const whole = digits.slice(0, -decimals);
    const fraction = digits.slice(-decimals).replace(/0+$/, '');
    return fraction ? `${whole}.${fraction}` : whole;
}

/**
 * The decoded amount in whole tokens, or `undefined` when the instruction is not a token-program
 * decode carrying both `amount` and `decimals`. Token amounts are unsigned, so no sign handling.
 */
export function toTokenUiAmount(programId: string, info: unknown): string | undefined {
    if (programId !== TOKEN_PROGRAM_ID && programId !== TOKEN_2022_PROGRAM_ID) {
        return undefined;
    }
    const checked = readCheckedAmount(info);
    return checked ? formatUiAmount(checked.amount, checked.decimals) : undefined;
}
