import { isCodamaRoot } from '../lib/utils';

export type IdlSpec = '0.1.0' | 'legacy' | 'codama';

export function getIdlSpecType(idl: unknown): IdlSpec {
    if (isCodamaRoot(idl)) return 'codama';
    const candidate = idl as { metadata?: { spec?: string } } | null | undefined;
    return (candidate?.metadata?.spec ?? 'legacy') as IdlSpec;
}
