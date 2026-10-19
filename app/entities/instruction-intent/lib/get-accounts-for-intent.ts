import type { ParsedInstruction } from '@codama/dynamic-parsers';
import type { Address } from '@solana/kit';
import type { RootNode } from 'codama';

import { loadIntentSdk } from './load-intent-sdk';

/** The sorted addresses the intent of a parsed instruction reads, for example a mint for its decimals. */
export async function getAccountsForIntent(root: RootNode, parsed: ParsedInstruction): Promise<Address[]> {
    const { getRequiredAccountsForDisplay } = await loadIntentSdk();
    return [...getRequiredAccountsForDisplay(root, parsed)].sort();
}
