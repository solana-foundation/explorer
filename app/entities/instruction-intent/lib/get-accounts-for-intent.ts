import type { ParsedInstruction } from '@codama/dynamic-parsers';
import type { Address } from '@solana/kit';
import type { RootNode } from 'codama';

/** The sorted addresses the intent of a parsed instruction reads, for example a mint for its decimals. */
export async function getAccountsForIntent(root: RootNode, parsed: ParsedInstruction): Promise<Address[]> {
    // Loaded on the first open, so the SDK stays out of the First Load JS of every page with an instruction card
    const { getRequiredAccountsForDisplay } = await import('@codama/dynamic-instructions');
    return [...getRequiredAccountsForDisplay(root, parsed)].sort();
}
