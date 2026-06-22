import { address, createSolanaRpc } from '@solana/kit';
// Type-only imports are erased at build, so they don't pull `@solana/security-txt` into the bundle.
import type { SecurityTxtFields, SecurityTxtSource } from '@solana/security-txt';

/** A resolved security.txt: which source produced it, plus its parsed fields. */
export type ResolvedSecurityTxt = { type: SecurityTxtSource; fields: SecurityTxtFields };

/**
 * Resolve a program's security.txt **in the browser** against a user-supplied RPC URL, for custom /
 * localhost clusters the server route can't reach. `@solana/security-txt` is heavy, so it's reached
 * only through the dynamic `import()` here — keeping its weight out of the known-cluster bundle. PMP
 * canonical-only (no fndn fallback) then Neodyme ELF; `includePmp` off → ELF only.
 */
export async function fetchSecurityTxtClient({
    programId,
    url,
    includePmp,
}: {
    programId: string;
    url: string;
    includePmp: boolean;
}): Promise<ResolvedSecurityTxt | undefined> {
    const { fetchElfSecurityTxt, fetchSecurityTxt } = await import('@solana/security-txt');
    const rpc = createSolanaRpc(url);
    const id = address(programId);
    if (includePmp) {
        // eslint-disable-next-line unicorn/no-null -- library API: null = canonical-only PMP lookup (no fndn fallback)
        const result = await fetchSecurityTxt(rpc, id, { authority: null });
        return result ? { fields: result.fields, type: result.type } : undefined;
    }
    const result = await fetchElfSecurityTxt(rpc, id);
    return result ? { fields: result.fields, type: 'elf' } : undefined;
}
