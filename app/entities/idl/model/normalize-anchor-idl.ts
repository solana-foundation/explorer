import type { IdlConst } from '@coral-xyz/anchor/dist/cjs/idl';
import { convertToCodama } from '@explorer/idl-decode/anchor';
import type { RootNode } from 'codama';

import { Logger } from '@/app/shared/lib/logger';

import { type CodamaIdl, type SupportedIdl } from '../lib/types';
import { getIdlSpecType } from './idl-spec';

export function normalizeAnchorIdl(idl: unknown, programAddress?: string): SupportedIdl | undefined {
    if (!idl) return undefined;
    if (getIdlSpecType(idl) !== 'legacy') return idl as SupportedIdl;

    const legacyConstants = (idl as { constants?: IdlConst[] }).constants;
    const withAddress =
        programAddress && !(idl as { metadata?: { address?: string } }).metadata?.address
            ? { ...(idl as object), metadata: { ...(idl as { metadata?: object }).metadata, address: programAddress } }
            : idl;

    const [error, converted] = convertToCodama(withAddress as Parameters<typeof convertToCodama>[0]);
    if (error || !converted) {
        Logger.error(new Error('[idl] Failed to convert legacy IDL to Codama', { cause: error }), { programAddress });
        return undefined;
    }

    // idl-decode and the app pin slightly different `codama` node types (version-template + display-node
    // branding); the runtime root node is identical, so cross the type boundary once here.
    const root = converted as unknown as RootNode;
    const program =
        programAddress && !root.program.publicKey ? { ...root.program, publicKey: programAddress } : root.program;
    const normalized: CodamaIdl = { ...root, program };
    return legacyConstants?.length ? { ...normalized, legacyConstants } : normalized;
}
