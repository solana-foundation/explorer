import { fetchProgramSecurityTxt, type ResolvedSecurityTxt } from '@entities/security-txt';
import { address, createSolanaRpc } from '@solana/kit';

export type { ResolvedSecurityTxt };

/**
 * Resolve a program's security.txt **in the browser** against a user-supplied RPC URL, for custom /
 * localhost clusters the server route can't reach. Delegates to the shared `fetchProgramSecurityTxt`
 * resolver, which reaches the heavy `@solana/security-txt` only through a dynamic `import()` - keeping its
 * weight out of the known-cluster bundle.
 */
export async function fetchSecurityTxtClient({
    programId,
    url,
}: {
    programId: string;
    url: string;
}): Promise<ResolvedSecurityTxt | undefined> {
    const rpc = createSolanaRpc(url);
    return fetchProgramSecurityTxt(rpc, address(programId));
}
