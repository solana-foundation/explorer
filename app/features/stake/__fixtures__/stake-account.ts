import { gen } from '@__fixtures__/gen';
import {
    type AccountInfoBase,
    type AccountInfoWithJsonData,
    address,
    type Base64EncodedBytes,
    lamports,
} from '@solana/kit';
import { STAKE_PROGRAM_ADDRESS } from '@solana-program/stake';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';

import { type StakeAccountInfo } from '../lib/validators';

/**
 * What kit's `getAccountInfo(…, { encoding: 'jsonParsed' })` returns in `value`, which is the shape
 * `parseStakeDelegation` reads. Integers are bigints and the epochs strings, matching kit's upcast
 * of the RPC response — see `StakeDelegationAccount`.
 */
type ParsedAccount = AccountInfoBase & AccountInfoWithJsonData;

const ACCOUNT_ENVELOPE = {
    executable: false,
    lamports: lamports(214_211_410n),
    owner: STAKE_PROGRAM_ADDRESS,
    space: 200n,
} as const;

export const STAKE_ACCOUNT_ADDRESS = gen.vanityAddress('STAKE');

/** On-chain, a still-delegated account carries `u64::MAX` rather than a real deactivation epoch. */
export const EPOCH_NEVER_SET = '18446744073709551615';

/** A stake account delegated in epoch 943 and still delegated, as jsonParsed returns it. */
export function makeStakeAccount({
    activationEpoch = '943',
    deactivationEpoch = EPOCH_NEVER_SET,
}: { activationEpoch?: string; deactivationEpoch?: string } = {}): ParsedAccount {
    return {
        ...ACCOUNT_ENVELOPE,
        data: {
            parsed: {
                info: {
                    meta: makeMeta(),
                    stake: {
                        creditsObserved: 959135070n,
                        delegation: {
                            activationEpoch,
                            deactivationEpoch,
                            stake: '211917944',
                            voter: STAKE_ACCOUNT_ADDRESS,
                        },
                    },
                },
                type: 'delegated',
            },
            program: 'stake',
            space: 200n,
        },
    };
}

/** An initialized stake account that was never delegated: jsonParsed emits `stake: null`. */
export function makeUndelegatedStakeAccount(): ParsedAccount {
    return {
        ...ACCOUNT_ENVELOPE,
        data: {
            parsed: { info: { meta: makeMeta(), stake: null }, type: 'initialized' },
            program: 'stake',
            space: 200n,
        },
    };
}

/**
 * A nonce account. jsonParsed reports it as `type: 'initialized'` too, so it is the case that
 * proves the type alone does not identify a stake account — only the `stake` key does.
 */
export function makeNonceAccount(): ParsedAccount {
    return {
        ...ACCOUNT_ENVELOPE,
        data: {
            parsed: {
                info: {
                    authority: STAKE_ACCOUNT_ADDRESS,
                    blockhash: gen.address(2),
                    feeCalculator: { lamportsPerSignature: '5000' },
                },
                type: 'initialized',
            },
            program: 'nonce',
            space: 80n,
        },
        owner: SYSTEM_PROGRAM_ADDRESS,
        space: 80n,
    };
}

/** An account belonging to some other program, so the stake validator rejects it. */
export function makeOtherProgramAccount(): ParsedAccount {
    return {
        ...ACCOUNT_ENVELOPE,
        data: {
            parsed: { info: { mint: gen.address(1) }, type: 'account' },
            program: 'spl-token',
            space: 165n,
        },
    };
}

/** The `[base64, 'base64']` tuple the RPC returns for a program it cannot parse. */
export function makeUnparsedAccount(): ParsedAccount {
    // Cast: `Base64EncodedBytes` is a branded string with no constructor to call.
    return { ...ACCOUNT_ENVELOPE, data: ['3q2+7w==' as Base64EncodedBytes, 'base64'] };
}

function makeMeta() {
    return {
        authorized: { staker: STAKE_ACCOUNT_ADDRESS, withdrawer: STAKE_ACCOUNT_ADDRESS },
        // Bigints, not numbers: kit upcasts both, and the epoch fields below stay strings.
        lockup: { custodian: STAKE_ACCOUNT_ADDRESS, epoch: 0n, unixTimestamp: 0n },
        rentExemptReserve: '2282880',
    };
}

/**
 * The validated domain shape (`StakeAccountInfo`), as the card receives it — bigints and branded
 * addresses, not the strings the RPC sends. Use `makeStakeAccount` for the parser's input instead.
 */
export function makeStakeAccountInfo({
    activationEpoch = 100n,
    deactivationEpoch = BigInt(EPOCH_NEVER_SET),
}: { activationEpoch?: bigint; deactivationEpoch?: bigint } = {}): StakeAccountInfo {
    return {
        meta: {
            authorized: { staker: address(STAKE_ACCOUNT_ADDRESS), withdrawer: address(STAKE_ACCOUNT_ADDRESS) },
            lockup: { custodian: address(SYSTEM_PROGRAM_ADDRESS), epoch: 0, unixTimestamp: 0 },
            rentExemptReserve: 2_282_880n,
        },
        stake: {
            creditsObserved: 12_345,
            delegation: {
                activationEpoch,
                deactivationEpoch,
                stake: 1_000_000_000n,
                voter: address(STAKE_ACCOUNT_ADDRESS),
                warmupCooldownRate: 0.09,
            },
        },
    };
}
