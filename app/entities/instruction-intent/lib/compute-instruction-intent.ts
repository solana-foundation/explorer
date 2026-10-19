import type { ParsedInstruction } from '@codama/dynamic-parsers';
import { type Address, isAddress, type MaybeEncodedAccount } from '@solana/kit';
import type { RootNode } from 'codama';

import type { InstructionIntent, IntentField, IntentSentencePart } from './intent';
import { loadIntentSdk } from './load-intent-sdk';

/**
 * Builds the intent of a parsed instruction from accounts fetched beforehand.
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
    const { getInstructionDisplayFromParsedInstruction } = await loadIntentSdk();
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
        usedAccountData: interpolated && accounts.some(account => account.exists),
    };
}

function knownAddresses(parsed: ParsedInstruction, fields: readonly IntentField[]): Address[] {
    const accounts = [...parsed.accounts, ...(parsed.remainingAccounts ?? [])].map(account => account.address);
    const values = fields.map(field => field.value).filter(isAddress);
    return [...new Set([...accounts, ...values])];
}

function splitIntoSentenceParts(text: string, addresses: readonly Address[]): IntentSentencePart[] {
    if (addresses.length === 0) {
        return text ? [{ kind: 'text', text }] : [];
    }

    const parts: IntentSentencePart[] = [];
    // eslint-disable-next-line no-restricted-globals -- one pass matches every address, base58 needs no escaping
    const matchAddressesRegex = new RegExp(addresses.join('|'), 'g');
    let cursor = 0;

    for (const match of text.matchAll(matchAddressesRegex)) {
        if (match.index > cursor) {
            parts.push({ kind: 'text', text: text.slice(cursor, match.index) });
        }
        parts.push({ address: match[0] as Address, kind: 'address' });
        cursor = match.index + match[0].length;
    }

    if (cursor < text.length) {
        parts.push({ kind: 'text', text: text.slice(cursor) });
    }
    return parts;
}
