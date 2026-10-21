import type { Address, Rpc, SolanaRpcApi } from '@solana/kit';
// Type-only imports are erased at build, so they don't pull the heavy `@solana/security-txt` into any
// caller's bundle - it's reached solely through the dynamic `import()` inside the resolver below.
import type { SecurityTxtFields, SecurityTxtSource } from '@solana/security-txt';

/** A resolved security.txt: which source produced it, plus its parsed fields. */
export type ResolvedSecurityTxt = { type: SecurityTxtSource; fields: SecurityTxtFields };

/**
 * Resolve a program's security.txt via `@solana/security-txt`: the PMP `security` seed (canonical authority
 * only - no fndn fallback) then the legacy Neodyme ELF section. The single source of truth for this lookup,
 * shared by the `/api/security-txt` route, the client resolver, and the account share-image card.
 */
export async function fetchProgramSecurityTxt(
    rpc: Rpc<SolanaRpcApi>,
    programId: Address,
): Promise<ResolvedSecurityTxt | undefined> {
    const { fetchSecurityTxt } = await import('@solana/security-txt');
    // eslint-disable-next-line unicorn/no-null -- library API: null = canonical-only PMP lookup (no fndn fallback)
    const result = await fetchSecurityTxt(rpc, programId, { authority: null });
    return result ? { fields: result.fields, type: result.type } : undefined;
}
