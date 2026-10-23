export type IdlSpec = '0.1.0' | 'legacy' | 'codama';

export function getIdlSpecType(idl: unknown): IdlSpec {
    const candidate = idl as { standard?: string; metadata?: { spec?: string } } | null | undefined;
    if (candidate?.standard === 'codama') return 'codama';
    return (candidate?.metadata?.spec ?? 'legacy') as IdlSpec;
}
