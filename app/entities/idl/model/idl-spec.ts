export type IdlSpec = '0.1.0' | 'legacy' | 'codama';

/**
 * Classifies an IDL by its on-chain shape: Codama root nodes report `standard: 'codama'`, modern
 * Anchor IDLs carry `metadata.spec` (e.g. `'0.1.0'`), and anything else is a pre-0.30 legacy Anchor
 * IDL. Pure structural inspection — no runtime dependency on Anchor or web3.js.
 */
export function getIdlSpecType(idl: unknown): IdlSpec {
    const candidate = idl as { standard?: string; metadata?: { spec?: string } } | null | undefined;
    if (candidate?.standard === 'codama') return 'codama';
    return (candidate?.metadata?.spec ?? 'legacy') as IdlSpec;
}
