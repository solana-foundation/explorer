import type { IdlConst } from '@coral-xyz/anchor/dist/cjs/idl';
import { convertToCodama } from '@explorer/idl-decode/anchor';
import type { RootNode } from 'codama';

import { Logger } from '@/app/shared/lib/logger';

import { type CodamaIdl, type LegacyAnchorEvent, type SupportedIdl } from '../lib/types';
import { getIdlSpecType } from './idl-spec';

export function normalizeAnchorIdl(idl: unknown, programAddress?: string): SupportedIdl | undefined {
    if (!idl) return undefined;
    if (getIdlSpecType(idl) !== 'legacy') return idl as SupportedIdl;

    const legacyConstants = (idl as { constants?: IdlConst[] }).constants;
    // Codama's rootNodeFromAnchor drops pre-0.30 inline-field events — carry them so the Events tab
    // still renders. Only events that actually carry fields (the legacy shape) are worth keeping.
    const legacyEvents = (idl as { events?: LegacyAnchorEvent[] }).events?.filter(event => event.fields?.length);
    const withAddress =
        programAddress && !(idl as { metadata?: { address?: string } }).metadata?.address
            ? { ...(idl as object), metadata: { ...(idl as { metadata?: object }).metadata, address: programAddress } }
            : idl;

    const [error, converted] = convertToCodama(withAddress as Parameters<typeof convertToCodama>[0]);
    if (error || !converted) {
        Logger.error(new Error('[idl] Failed to convert legacy IDL to Codama', { cause: error }), { programAddress });
        return undefined;
    }

    const root = converted as unknown as RootNode;
    const program =
        programAddress && !root.program.publicKey ? { ...root.program, publicKey: programAddress } : root.program;
    const normalized: CodamaIdl = {
        ...root,
        program,
        ...(legacyConstants?.length ? { legacyConstants } : {}),
        ...(legacyEvents?.length ? { legacyEvents } : {}),
    };
    return normalized;
}
