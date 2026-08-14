'use client';

import type { BufferAccount } from '@entities/pmp-account';
import { sha256 } from '@noble/hashes/sha256';
import React from 'react';

import { bytes, toHex } from '@/app/shared/lib/bytes';

import {
    type ConfigResolutionFromBytesResult,
    hasPmpPayload,
    isConfigFromBytesResolutionUncertain,
} from '../lib/config-resolution/resolve-buffer-config-from-bytes';
import { PMP_FULL_CONFIG_LOOKUP } from '../lib/constants';
import { useResolveBufferConfigFromBytes } from './use-resolve-buffer-config-from-bytes';
import { useResolveBufferConfigOnchain } from './use-resolve-buffer-config-onchain';

/**
 * Tries to decode Buffer account data.
 * A Metadata account carries its own decode config, a Buffer doesn't and its config has be resolved first.
 *
 * Two strategies to resolve a Buffer's config are "Resolution from bytes" and "Resolution from intructions (Lookup)".
 * - Resolution from bytes tries to resolve config from bytes. It runs first.
 * - Lookup tries to resolve config from the on-chain instructions that holds the config (initialize, setData, etc).
 */
export function useDecodeBufferPayload({ account, address }: { account: BufferAccount | undefined; address: string }) {
    const configFromBytes = useResolveBufferConfigFromBytes(account);

    // The lookup is immutable per buffer VERSION, not per address: a later `setData` declares a new config, and the
    // cached one must not outlive the bytes it was resolved against. Fingerprinting the body rather than keying on
    // the account's identity is what keeps that cheap - the provider hands back a new object on every fetch, so an
    // identity key would re-run the scan even when the chain returned the very same bytes.
    const fingerprint = React.useMemo(() => (account ? toHex(sha256(bytes(account.data))) : ''), [account]);

    const enabled = shouldResolveOnchain(configFromBytes.status === 'ready' ? configFromBytes.result : undefined);
    const configFromOnchain = useResolveBufferConfigOnchain({ address, enabled, fingerprint });

    return { configFromBytes, configFromOnchain };
}

/**
 * Whether the on-chain strategy is worth an RPC call, given what the from-bytes strategy already resolved.
 *
 * The from-bytes strategy must have produced a payload either way. The on-chain one supplies labels, and for a
 * disagreement a different rendering of bytes already unpacked - it never supplies the bytes themselves.
 *
 * `PMP_FULL_CONFIG_LOOKUP` off means an already-certain result resolves nothing further and the call is skipped. On
 * means the lookup also runs for certain payloads, purely to fill in `encoding` and `dataSource`, which no amount of
 * byte evidence can produce.
 */
function shouldResolveOnchain(fromBytes: ConfigResolutionFromBytesResult | undefined): boolean {
    if (fromBytes === undefined) return false;

    return PMP_FULL_CONFIG_LOOKUP ? hasPmpPayload(fromBytes) : isConfigFromBytesResolutionUncertain(fromBytes);
}
