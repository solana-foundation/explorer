// PMP leg — the canonical @solana-program/program-metadata client owns seeds, encodings, compression.
import { DataSource, fetchMaybeMetadataFromSeeds, Format, unpackAndFetchData } from '@solana-program/program-metadata';
import type { Address } from '@solana/kit';

import { IDL_ERROR__IDL_PARSE_FAILED, IdlError } from '../errors.js';
import type { IdlFetcherRpc } from '../types.js';

/** Resolve the program's PMP `idl` metadata; `undefined` when none is published. */
export async function fetchPmpIdl(
    rpc: IdlFetcherRpc,
    program: Address,
    authority: Address | null,
    abortSignal?: AbortSignal,
): Promise<unknown> {
    const metadata = await fetchMaybeMetadataFromSeeds(rpc, { authority, program, seed: 'idl' }, { abortSignal });
    if (!metadata.exists) return undefined;
    if (metadata.data.format !== Format.Json) {
        throw new IdlError(IDL_ERROR__IDL_PARSE_FAILED, { operation: 'pmp idl metadata format' });
    }
    let content: string;
    try {
        // url-sourced payloads go through global fetch — only the metadata read above is signal-bound
        content = await unpackAndFetchData({ rpc, ...metadata.data });
    } catch (cause) {
        // a direct payload fails only on corrupt on-chain bytes; url payloads can fail on transport — those stay raw
        if (metadata.data.dataSource !== DataSource.Direct) throw cause;
        throw new IdlError(IDL_ERROR__IDL_PARSE_FAILED, { cause, operation: 'pmp idl data' });
    }
    try {
        return JSON.parse(content);
    } catch (cause) {
        throw new IdlError(IDL_ERROR__IDL_PARSE_FAILED, { cause, operation: 'pmp idl content' });
    }
}
