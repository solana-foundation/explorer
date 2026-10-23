import { convertToCodama } from '@explorer/idl-decode/anchor';
import type { RootNode } from 'codama';

import { Logger } from '@/app/shared/lib/logger';

import { type SupportedIdl } from '../lib/types';
import { getIdlSpecType } from './idl-spec';

/**
 * Normalizes a resolved IDL to a shape the app's decode/display/interactive paths understand.
 *
 * Modern Anchor (`metadata.spec`) and Codama (`standard: 'codama'`) IDLs pass through untouched.
 * A legacy pre-0.30 Anchor IDL is converted to a Codama `RootNode` via `@explorer/idl-decode`'s
 * patched `nodes-from-anchor`, so legacy programs flow through the same Codama paths as PMP IDLs
 * instead of the retired in-house Anchor up-converter.
 *
 * `programAddress` backfills the Codama program id for legacy IDLs that carry no `metadata.address`
 * (the viewed program is the source of truth). Returns `undefined` only when conversion fails.
 */
export function normalizeAnchorIdl(idl: unknown, programAddress?: string): SupportedIdl | undefined {
    if (!idl) return undefined;
    if (getIdlSpecType(idl) !== 'legacy') return idl as SupportedIdl;

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
    if (programAddress && !root.program.publicKey) {
        return { ...root, program: { ...root.program, publicKey: programAddress } };
    }
    return root;
}
