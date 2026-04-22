import { Account, isTokenProgramData } from '@providers/accounts';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import { MintAccountInfo, TokenAccountInfo } from '@validators/accounts/token';
import { useMemo } from 'react';
import { create, Struct } from 'superstruct';

import {
    buildSplMintRegions,
    buildSplTokenAccountRegions,
    SPL_MINT_SIZE,
    SPL_TOKEN_ACCOUNT_SIZE,
} from '@/app/features/annotated-hex/model/spl-token';
import { Region } from '@/app/features/annotated-hex/model/types';

export const MAX_ANNOTATABLE_SIZE = 4096;

export type RegionsState =
    | { status: 'regions'; regions: Region[] }
    | {
          status: 'fallback';
          reason: 'no-raw' | 'oversize' | 'unknown-owner' | 'multisig' | 'unexpected-length';
      };

const TOKEN_PROGRAM_ID_BASE58 = TOKEN_PROGRAM_ID.toBase58();
const TOKEN_2022_PROGRAM_ID_BASE58 = TOKEN_2022_PROGRAM_ID.toBase58();

export function useAccountRegions(
    account: Account | null | undefined,
    rawData: Uint8Array | undefined,
): RegionsState {
    const ownerBase58 = account?.owner.toBase58() ?? null;
    const parsedData = account?.data.parsed;

    return useMemo<RegionsState>(() => {
        if (!rawData) return { reason: 'no-raw', status: 'fallback' };
        if (rawData.length > MAX_ANNOTATABLE_SIZE) return { reason: 'oversize', status: 'fallback' };
        if (!ownerBase58) return { reason: 'unknown-owner', status: 'fallback' };

        const tokenParsed = parsedData && isTokenProgramData(parsedData) ? parsedData.parsed : undefined;

        if (tokenParsed?.type === 'multisig') {
            return { reason: 'multisig', status: 'fallback' };
        }

        if (ownerBase58 !== TOKEN_PROGRAM_ID_BASE58 && ownerBase58 !== TOKEN_2022_PROGRAM_ID_BASE58) {
            return { reason: 'unknown-owner', status: 'fallback' };
        }

        if (ownerBase58 === TOKEN_PROGRAM_ID_BASE58) {
            if (rawData.length === SPL_MINT_SIZE) {
                return {
                    regions: buildSplMintRegions(rawData, safeCreate(tokenParsed?.info, MintAccountInfo)),
                    status: 'regions',
                };
            }
            if (rawData.length === SPL_TOKEN_ACCOUNT_SIZE) {
                return {
                    regions: buildSplTokenAccountRegions(
                        rawData,
                        safeCreate(tokenParsed?.info, TokenAccountInfo),
                    ),
                    status: 'regions',
                };
            }
            return { reason: 'unexpected-length', status: 'fallback' };
        }

        // Token-2022. Prefer parsed.type when available; otherwise size disambiguates.
        if (tokenParsed?.type === 'mint') {
            if (rawData.length < SPL_MINT_SIZE) return { reason: 'unexpected-length', status: 'fallback' };
            return {
                regions: buildSplMintRegions(rawData, safeCreate(tokenParsed.info, MintAccountInfo)),
                status: 'regions',
            };
        }
        if (tokenParsed?.type === 'account') {
            if (rawData.length < SPL_TOKEN_ACCOUNT_SIZE) return { reason: 'unexpected-length', status: 'fallback' };
            return {
                regions: buildSplTokenAccountRegions(rawData, safeCreate(tokenParsed.info, TokenAccountInfo)),
                status: 'regions',
            };
        }
        if (rawData.length < SPL_TOKEN_ACCOUNT_SIZE && rawData.length >= SPL_MINT_SIZE) {
            return { regions: buildSplMintRegions(rawData, undefined), status: 'regions' };
        }
        if (rawData.length >= SPL_TOKEN_ACCOUNT_SIZE) {
            return { regions: buildSplTokenAccountRegions(rawData, undefined), status: 'regions' };
        }
        return { reason: 'unexpected-length', status: 'fallback' };
    }, [rawData, ownerBase58, parsedData]);
}

/**
 * Narrow an `any()`-typed superstruct payload into a typed shape, or undefined
 * if the payload is missing or doesn't conform. Failures fall through to the
 * builder's raw-byte decoding path.
 */
function safeCreate<T>(value: unknown, validator: Struct<T, unknown>): T | undefined {
    if (value == null) return undefined;
    try {
        return create(value, validator);
    } catch {
        return undefined;
    }
}
