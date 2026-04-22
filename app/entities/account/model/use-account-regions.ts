import { useMemo } from 'react';

import {
    buildSplMintRegions,
    buildSplTokenAccountRegions,
    ParsedMintInfo,
    ParsedTokenAccountInfo,
    SPL_MINT_SIZE,
    SPL_TOKEN_ACCOUNT_SIZE,
} from '@/app/features/annotated-hex/model/spl-token';
import { Region } from '@/app/features/annotated-hex/model/types';
import { Account, isTokenProgramData } from '@providers/accounts';

/**
 * Upper bound on `rawData.length` we are willing to annotate.
 *
 * Token-2022 accounts with many extensions top out at a few hundred bytes; even
 * Metaplex metadata accounts sit under 1KB. 4KB gives generous headroom while
 * ensuring program-data accounts (which can be hundreds of KB) fall through
 * to plain HexData without triggering the annotator.
 */
export const MAX_ANNOTATABLE_SIZE = 4096;

export type RegionsState =
    | { status: 'regions'; regions: Region[] }
    | {
          status: 'fallback';
          reason: 'no-raw' | 'oversize' | 'unknown-owner' | 'multisig' | 'unexpected-length';
      };

/**
 * Dispatches an `Account` + its `rawData` to the right layout-schema region builder.
 * Returns `{status: 'fallback'}` for any path where the annotator cannot produce
 * safe output — callers render plain HexData in that case.
 *
 * Memoization uses a stable JSON-slice of `account.data.parsed` so SWR
 * revalidations that return structurally-equal data do not invalidate the
 * cached region array.
 */
export function useAccountRegions(
    account: Account | null | undefined,
    rawData: Uint8Array | undefined,
): RegionsState {
    const ownerBase58 = useMemo(() => account?.owner.toBase58() ?? null, [account?.owner]);

    const parsedSignature = useMemo(() => {
        const parsedData = account?.data.parsed;
        if (!parsedData || !isTokenProgramData(parsedData)) return null;
        // Structural signature: stable across SWR revalidations when values are unchanged.
        // `info` is `any()` per Explorer's validator, but its shape is deterministic in practice.
        return JSON.stringify({ type: parsedData.parsed.type, info: parsedData.parsed.info });
    }, [account?.data.parsed]);

    return useMemo<RegionsState>(() => {
        if (!rawData) return { status: 'fallback', reason: 'no-raw' };
        if (rawData.length > MAX_ANNOTATABLE_SIZE) return { status: 'fallback', reason: 'oversize' };
        if (!ownerBase58) return { status: 'fallback', reason: 'unknown-owner' };

        const parsedData = account?.data.parsed;
        const tokenParsed = parsedData && isTokenProgramData(parsedData) ? parsedData.parsed : undefined;

        if (tokenParsed?.type === 'multisig') {
            return { status: 'fallback', reason: 'multisig' };
        }

        const isTokenOwner =
            ownerBase58 === TOKEN_PROGRAM_ID_BASE58 || ownerBase58 === TOKEN_2022_PROGRAM_ID_BASE58;
        if (!isTokenOwner) {
            return { status: 'fallback', reason: 'unknown-owner' };
        }

        // Legacy SPL Token — strict size match, no TLV tail possible.
        if (ownerBase58 === TOKEN_PROGRAM_ID_BASE58) {
            if (rawData.length === SPL_MINT_SIZE) {
                return {
                    status: 'regions',
                    regions: buildSplMintRegions(rawData, tokenParsed?.info as ParsedMintInfo | undefined),
                };
            }
            if (rawData.length === SPL_TOKEN_ACCOUNT_SIZE) {
                return {
                    status: 'regions',
                    regions: buildSplTokenAccountRegions(
                        rawData,
                        tokenParsed?.info as ParsedTokenAccountInfo | undefined,
                    ),
                };
            }
            return { status: 'fallback', reason: 'unexpected-length' };
        }

        // Token-2022 — base size plus optional TLV tail. Disambiguate via parsed.type
        // when available; otherwise use size to choose.
        if (tokenParsed?.type === 'mint') {
            if (rawData.length < SPL_MINT_SIZE) return { status: 'fallback', reason: 'unexpected-length' };
            return {
                status: 'regions',
                regions: buildSplMintRegions(rawData, tokenParsed.info as ParsedMintInfo | undefined),
            };
        }
        if (tokenParsed?.type === 'account') {
            if (rawData.length < SPL_TOKEN_ACCOUNT_SIZE) return { status: 'fallback', reason: 'unexpected-length' };
            return {
                status: 'regions',
                regions: buildSplTokenAccountRegions(
                    rawData,
                    tokenParsed.info as ParsedTokenAccountInfo | undefined,
                ),
            };
        }

        // No parsed.type (jsonParsed didn't land or isn't supported). Disambiguate by size.
        if (rawData.length < SPL_TOKEN_ACCOUNT_SIZE && rawData.length >= SPL_MINT_SIZE) {
            return { status: 'regions', regions: buildSplMintRegions(rawData, undefined) };
        }
        if (rawData.length >= SPL_TOKEN_ACCOUNT_SIZE) {
            return { status: 'regions', regions: buildSplTokenAccountRegions(rawData, undefined) };
        }
        return { status: 'fallback', reason: 'unexpected-length' };
        // parsedSignature is included in deps so same-byte/different-parsed transitions still recompute.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rawData, ownerBase58, parsedSignature, account?.data.parsed]);
}

// Base58 forms of TOKEN_PROGRAM_ID / TOKEN_2022_PROGRAM_ID.
// Kept as constants so we compare strings (cheap, referentially stable).
// Sourced from @providers/accounts/tokens which exports PublicKey instances;
// these base58 strings match `new PublicKey(...).toBase58()` for those keys.
export const TOKEN_PROGRAM_ID_BASE58 = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const TOKEN_2022_PROGRAM_ID_BASE58 = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
