// Anchor leg — mirrors anchor's `Program.fetchIdl` (idl PDA → account → decode → inflate → parse),
// kit-native address derivation and abortable rpc reads.
import { Buffer } from 'buffer';

// not re-exported from anchor's main entry; the deep import also skips the Program/Provider graph
import { decodeIdlAccount } from '@coral-xyz/anchor/dist/cjs/idl.js';
import { type Address, createAddressWithSeed, getBase64Encoder, getProgramDerivedAddress } from '@solana/kit';

import { IDL_ERROR__IDL_PARSE_FAILED, IdlError } from '../errors.js';
import type { IdlFetcherRpc } from '../types.js';

/** Resolve the program's Anchor IDL PDA account; `undefined` when none exists. */
export async function fetchAnchorPdaIdl(
    rpc: IdlFetcherRpc,
    program: Address,
    abortSignal?: AbortSignal,
): Promise<unknown> {
    const [baseAddress] = await getProgramDerivedAddress({ programAddress: program, seeds: [] });
    const idlAddress = await createAddressWithSeed({ baseAddress, programAddress: program, seed: 'anchor:idl' });
    const { value } = await rpc.getAccountInfo(idlAddress, { encoding: 'base64' }).send({ abortSignal });
    if (!value) return undefined;
    const bytes = getBase64Encoder().encode(value.data[0]);
    try {
        // anchor's own account decoder (authority + deflated data vec) — parity by reuse, not by reimplementing the layout
        const idlAccount = decodeIdlAccount(Buffer.from(bytes.buffer, bytes.byteOffset + 8, bytes.length - 8));
        const inflated = await inflate(idlAccount.data);
        return JSON.parse(new TextDecoder().decode(inflated));
    } catch (cause) {
        throw new IdlError(IDL_ERROR__IDL_PARSE_FAILED, { cause, operation: 'anchor idl account data' });
    }
}

// zlib inflate via the standard DecompressionStream (Node >= 18, all modern browsers) — the format
// anchor's pako.inflate produces, with zero dependency.
async function inflate(deflated: Uint8Array): Promise<Uint8Array> {
    const stream = new Blob([deflated]).stream().pipeThrough(new DecompressionStream('deflate'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
}
