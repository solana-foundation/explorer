import { getInstructionDisplayFromParsedInstruction } from '@codama/dynamic-instructions';
import type { ParsedInstruction } from '@codama/dynamic-parsers';
import { type Address, isAddress, type MaybeEncodedAccount } from '@solana/kit';
import type { RootNode } from 'codama';

import type { InstructionIntent, IntentField, IntentSentencePart } from './intent';

/**
 * Builds the intent of a parsed instruction from accounts fetched beforehand.
 * An account missing from `accounts` reads as nonexistent, so the SDK withholds a sentence it cannot scale.
 */
export async function computeInstructionIntent({
    root,
    parsed,
    accounts,
}: {
    root: RootNode;
    parsed: ParsedInstruction;
    accounts: readonly MaybeEncodedAccount[];
}): Promise<InstructionIntent> {
    const byAddress = new Map(accounts.map(account => [account.address, account]));
    const display = await getInstructionDisplayFromParsedInstruction(root, parsed, {
        fetchAccount: async address => byAddress.get(address) ?? { address, exists: false },
    });
    const sentenceParts = splitIntoSentenceParts(
        display.interpolatedIntent ?? display.intent,
        knownAddresses(parsed, display.fields),
    );
    const interpolated = display.interpolatedIntent !== null;

    return {
        fields: display.fields,
        interpolated,
        sentenceParts,
        // The account note belongs to a sentence, and a withheld sentence already shows its own note
        usedAccountData: interpolated && accounts.some(account => account.exists),
    };
}

function knownAddresses(parsed: ParsedInstruction, fields: readonly IntentField[]): Address[] {
    const accounts = [...parsed.accounts, ...(parsed.remainingAccounts ?? [])].map(account => account.address);
    const values = fields.map(field => field.value).filter(isAddress);
    return [...new Set([...accounts, ...values])];
}

function splitIntoSentenceParts(text: string, addresses: readonly Address[]): IntentSentencePart[] {
    const parts: IntentSentencePart[] = [];
    let cursor = 0;

    for (let next = findNextAddress(text, cursor, addresses); next; next = findNextAddress(text, cursor, addresses)) {
        if (next.index > cursor) parts.push({ kind: 'text', text: text.slice(cursor, next.index) });
        parts.push({ address: next.address, kind: 'address' });
        cursor = next.index + next.address.length;
    }

    if (cursor < text.length) parts.push({ kind: 'text', text: text.slice(cursor) });
    return parts;
}

function findNextAddress(
    text: string,
    from: number,
    addresses: readonly Address[],
): { address: Address; index: number } | undefined {
    let next: { address: Address; index: number } | undefined;
    for (const address of addresses) {
        const index = text.indexOf(address, from);
        if (index !== -1 && (next === undefined || index < next.index)) next = { address, index };
    }
    return next;
}
