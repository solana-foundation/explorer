// We replay the warmup/cooldown math locally because the `getStakeActivation` JSON-RPC method
// was removed from validators (~v1.17), so neither @solana/kit nor @solana/web3.js ships a helper.
// The math itself lives in ../lib/stake-activation-math.ts — this file is just the kit-side
// fetch + parse + assembly.
//
// The only published alternative is @anza-xyz/solana-rpc-get-stake-activation, but it appears
// stale: v2.0.0 (the kit-compatible release) was last published 2024-10-03, pins to
// `@solana/*@2.0.0-rc.0` (release-candidate, while this repo is on @solana/kit@6.5.0), and was
// never promoted to the `latest` dist-tag (which still points at the web3.js v1 build).
// Re-check periodically — if Anza cuts a kit-6-aligned release, swap this file for it.
//
// @solana-program/stake can't replace this: it's a Codama-generated program client (instructions,
// account codecs, types), and activation-state replay isn't on-chain logic, so it isn't generated.
import { type AccountInfoWithJsonData, type Address, address, type JsonParsedSysvarAccount } from '@solana/kit';

import {
    type Delegation,
    getStakeActivatingAndDeactivating,
    type StakeActivatingAndDeactivating,
    type StakeHistoryEntry,
} from '../lib/stake-activation-math';

export type StakeActivationStatus = 'active' | 'activating' | 'deactivating' | 'inactive';

interface StakeActivation {
    status: StakeActivationStatus;
    active: bigint;
    inactive: bigint;
}

// Minimal RPC surface this function depends on. Declared structurally so the production
// `Rpc<GetAccountInfoApi & GetEpochInfoApi>` satisfies it by width, and tests can build a typed
// mock without a cast at the test boundary.
type AccountInfoResponse = {
    value: {
        data: AccountInfoWithJsonData['data'];
    } | null;
};
export interface StakeActivationRpc {
    getEpochInfo(): { send(): Promise<{ epoch: bigint }> };
    getAccountInfo(address: Address, config: { encoding: 'jsonParsed' }): { send(): Promise<AccountInfoResponse> };
}

// The kit-typed shape of `getAccountInfo(…, { encoding: 'jsonParsed' }).send()`'s `value.data`:
// either the program-specific parsed JSON, or a `[base64, 'base64']` tuple when the RPC could
// not parse the account.
type JsonAccountData = AccountInfoWithJsonData['data'];
type ParsedAccountData = Exclude<JsonAccountData, readonly [string, string]>;

// The kit ecosystem doesn't ship a constant for the stake-history sysvar (and @solana-program/stake
// only exports STAKE_PROGRAM_ADDRESS), so the on-chain literal is the source of truth here.
export const SYSVAR_STAKE_HISTORY_ADDRESS = address('SysvarStakeHistory1111111111111111111111111');

export type StakeActivationInput = {
    delegation: Delegation;
    rentExemptReserve: bigint;
    lamports: bigint;
};

// Caller supplies the already-parsed delegation + rent + lamports (it just parsed them in
// `handleParsedAccountData`), so we only need to fetch the cluster-wide stake-history sysvar
// and the current epoch. Avoids a redundant stake-account round trip and the race window
// between two `getAccountInfo` calls.
export async function getStakeActivation(
    rpc: StakeActivationRpc,
    { delegation, rentExemptReserve, lamports }: StakeActivationInput,
): Promise<StakeActivation> {
    const [epochInfo, stakeHistoryResponse] = await Promise.all([
        rpc.getEpochInfo().send(),
        rpc.getAccountInfo(SYSVAR_STAKE_HISTORY_ADDRESS, { encoding: 'jsonParsed' }).send(),
    ]);

    if (stakeHistoryResponse.value === null) {
        throw new Error('StakeHistory not found');
    }

    const stakeHistory = parseStakeHistory(stakeHistoryResponse.value.data);

    const { effective, activating, deactivating } = getStakeActivatingAndDeactivating(
        delegation,
        epochInfo.epoch,
        stakeHistory,
    );

    return {
        active: effective,
        inactive: lamports - effective - rentExemptReserve,
        status: deriveStatus({ activating, deactivating, effective }),
    };
}

function deriveStatus({ effective, activating, deactivating }: StakeActivatingAndDeactivating): StakeActivationStatus {
    if (deactivating > 0n) return 'deactivating';
    if (activating > 0n) return 'activating';
    if (effective > 0n) return 'active';
    return 'inactive';
}

function parseStakeHistory(data: JsonAccountData): StakeHistoryEntry[] {
    if (Array.isArray(data)) {
        // `[base64, 'base64']` tuple — RPC couldn't parse the account
        throw new Error('Stake history sysvar data is not parsed');
    }
    if (!isStakeHistorySysvar(data.parsed)) {
        throw new Error('Account is not the stake history sysvar');
    }
    return data.parsed.info.map(entry => ({
        activating: BigInt(entry.stakeHistory.activating),
        deactivating: BigInt(entry.stakeHistory.deactivating),
        effective: BigInt(entry.stakeHistory.effective),
        epoch: BigInt(entry.epoch),
    }));
}

function isStakeHistorySysvar(
    parsed: ParsedAccountData['parsed'],
): parsed is Extract<JsonParsedSysvarAccount, { type: 'stakeHistory' }> {
    return parsed.type === 'stakeHistory' && Array.isArray(parsed.info);
}
