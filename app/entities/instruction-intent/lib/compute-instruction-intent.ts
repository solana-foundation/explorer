import type { ParsedInstruction } from '@codama/dynamic-parsers';
import { type Address, address, isAddress, type MaybeEncodedAccount } from '@solana/kit';
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
    const known = new Set<string>(addresses);
    const parts: IntentSentencePart[] = [];
    let pendingText = '';
    // A base58 address is one word segment, so an address inside a longer string stays text
    // Created per call, so a browser without Intl.Segmenter fails only the intent, not the module import
    const wordSegmenter = new Intl.Segmenter('en', { granularity: 'word' });

    for (const { segment } of wordSegmenter.segment(text)) {
        if (!known.has(segment)) {
            pendingText += segment;
            continue;
        }
        if (pendingText) {
            parts.push({ kind: 'text', text: pendingText });
            pendingText = '';
        }
        parts.push({ address: address(segment), kind: 'address' });
    }

    if (pendingText) {
        parts.push({ kind: 'text', text: pendingText });
    }
    return parts;
}
