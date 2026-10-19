import {
    isParsedInstructionProgram,
    type KitInstruction,
    type ParsedInstructionInfo,
    type ParserProgramLabel,
    VOTE_PROGRAM_LABEL,
} from '@explorer/parsers';
import {
    addDecoderSizePrefix,
    type Address,
    createDecoder,
    type Decoder,
    fixDecoderSize,
    getAddressDecoder,
    getArrayDecoder,
    getBase58Decoder,
    getBase64Decoder,
    getBytesDecoder,
    getI64Decoder,
    getStructDecoder,
    getU8Decoder,
    getU16Decoder,
    getU32Decoder,
    getU64Decoder,
    getUtf8Decoder,
    type ReadonlyUint8Array,
    transformDecoder,
} from '@solana/kit';
import type { ParsedInstruction } from '@solana/web3.js';
import { create, type Infer, type Struct } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import { VOTE_PROGRAM_ADDRESS } from './constants';
import {
    AuthorizeInfo,
    AuthorizeWithSeedInfo,
    DepositDelegatorRewardsInfo,
    InitializeInfo,
    InitializeV2Info,
    TowerSyncInfo,
    UpdateCommissionBpsInfo,
    UpdateCommissionCollectorInfo,
    UpdateCommissionInfo,
    UpdateValidatorIdentityInfo,
    UpdateVoteStateInfo,
    VoteInfo,
    WithdrawInfo,
} from './instruction-types';

export { VOTE_PROGRAM_ADDRESS };

/** RPC `parsed.program` discriminator for the program; also the slice's `programLabel`. */
export const VOTE_PARSER_LABEL = VOTE_PROGRAM_LABEL satisfies ParserProgramLabel;

const VOTE_INFO = {
    authorize: AuthorizeInfo,
    authorizeChecked: AuthorizeInfo,
    authorizeCheckedWithSeed: AuthorizeWithSeedInfo,
    authorizeWithSeed: AuthorizeWithSeedInfo,
    compactupdatevotestate: UpdateVoteStateInfo,
    compactupdatevotestateswitch: UpdateVoteStateInfo,
    depositDelegatorRewards: DepositDelegatorRewardsInfo,
    initialize: InitializeInfo,
    initializeV2: InitializeV2Info,
    towersync: TowerSyncInfo,
    towersyncswitch: TowerSyncInfo,
    updateCommission: UpdateCommissionInfo,
    updateCommissionBps: UpdateCommissionBpsInfo,
    updateCommissionCollector: UpdateCommissionCollectorInfo,
    updateValidatorIdentity: UpdateValidatorIdentityInfo,
    updatevotestate: UpdateVoteStateInfo,
    updatevotestateswitch: UpdateVoteStateInfo,
    vote: VoteInfo,
    voteSwitch: VoteInfo,
    withdraw: WithdrawInfo,
};

type VoteInstructionType = keyof typeof VOTE_INFO;

/**
 * Canonical shape for a parsed vote instruction. The type strings, `info` field names and value
 * encodings are those of agave's `parse_vote`, so the byte path and the RPC path feed one card.
 */
export type VoteParsed = {
    [T in VoteInstructionType]: ParsedInstructionInfo<T, Infer<(typeof VOTE_INFO)[T]>>;
}[VoteInstructionType];

/** Decode a raw vote instruction into the shape agave's `parse_vote` emits for the same bytes. */
export function parseVoteKitInstruction(ix: KitInstruction): VoteParsed | undefined {
    try {
        const [discriminant, offset] = getU32Decoder().read(ix.data, 0);
        const decoded = decodeVoteInstruction(discriminant, ix.data, offset);
        const accounts = ix.accounts.map(account => account.address);
        // Agave rejects an instruction with fewer accounts than its fixed positions.
        if (!decoded || accounts.length < decoded.minAccounts) return undefined;
        const { info, type } = decoded.toParsed(accounts);
        return toVoteParsed(type, info);
    } catch {
        // Short or malformed data; the dispatcher renders that as unknown.
        return undefined;
    }
}

/** Normalise an RPC-pre-parsed vote instruction into `VoteParsed`. */
export function parseVoteRpcInstruction(ix: ParsedInstruction): VoteParsed | undefined {
    if (!isParsedInstructionProgram(ix, VOTE_PARSER_LABEL)) return undefined;
    const { type } = ix.parsed;
    if (!isVoteInstructionType(type)) return undefined;
    try {
        return toVoteParsed(type, ix.parsed.info);
    } catch (error) {
        // The program label already matched, so a validation failure here means the RPC sent a payload
        // we don't model — worth surfacing. Returning undefined falls back to the unknown-instruction card.
        Logger.error(error, { instructionType: type, program: ix.program });
        return undefined;
    }
}

type DecodedVoteInstruction = {
    minAccounts: number;
    toParsed(accounts: Address[]): { type: VoteInstructionType; info: unknown };
};

// Bincode u32 discriminants of agave's `VoteInstruction` enum, in declaration order.
function decodeVoteInstruction(
    discriminant: number,
    data: ReadonlyUint8Array,
    offset: number,
): DecodedVoteInstruction | undefined {
    const read = <T>(decoder: Decoder<T>) => decoder.read(data, offset)[0];
    switch (discriminant) {
        case 0: {
            const init = read(voteInitDecoder);
            return {
                minAccounts: 4,
                toParsed: ([voteAccount, rentSysvar, clockSysvar, node]) => ({
                    info: {
                        authorizedVoter: init.authorizedVoter,
                        authorizedWithdrawer: init.authorizedWithdrawer,
                        clockSysvar,
                        commission: init.commission,
                        node,
                        rentSysvar,
                        voteAccount,
                    },
                    type: 'initialize',
                }),
            };
        }
        case 1: {
            const { authorityType, newAuthority } = read(authorizeDecoder);
            return {
                minAccounts: 3,
                toParsed: ([voteAccount, clockSysvar, authority]) => ({
                    info: { authority, authorityType, clockSysvar, newAuthority, voteAccount },
                    type: 'authorize',
                }),
            };
        }
        case 2:
            return legacyVote('vote', read(voteDecoder));
        case 3: {
            const lamports = toNumber(read(getU64Decoder()));
            return {
                minAccounts: 3,
                toParsed: ([voteAccount, destination, withdrawAuthority]) => ({
                    info: { destination, lamports, voteAccount, withdrawAuthority },
                    type: 'withdraw',
                }),
            };
        }
        case 4:
            return {
                minAccounts: 3,
                toParsed: ([voteAccount, newValidatorIdentity, withdrawAuthority]) => ({
                    info: { newValidatorIdentity, voteAccount, withdrawAuthority },
                    type: 'updateValidatorIdentity',
                }),
            };
        case 5: {
            const commission = read(getU8Decoder());
            return {
                minAccounts: 2,
                toParsed: ([voteAccount, withdrawAuthority]) => ({
                    info: { commission, voteAccount, withdrawAuthority },
                    type: 'updateCommission',
                }),
            };
        }
        case 6: {
            const { hash, update } = read(withSwitchHash(voteDecoder));
            return legacyVote('voteSwitch', update, hash);
        }
        case 7: {
            const authorityType = read(voteAuthorizeDecoder);
            return {
                minAccounts: 4,
                toParsed: ([voteAccount, clockSysvar, authority, newAuthority]) => ({
                    info: { authority, authorityType, clockSysvar, newAuthority, voteAccount },
                    type: 'authorizeChecked',
                }),
            };
        }
        case 8:
            return voteStateUpdate('updatevotestate', read(voteStateUpdateDecoder));
        case 9: {
            const { hash, update } = read(withSwitchHash(voteStateUpdateDecoder));
            return voteStateUpdate('updatevotestateswitch', update, hash);
        }
        case 10: {
            const args = read(authorizeWithSeedDecoder);
            return {
                minAccounts: 3,
                toParsed: ([voteAccount, clockSysvar, authorityBaseKey]) => ({
                    info: {
                        authorityBaseKey,
                        authorityOwner: args.authorityOwner,
                        authoritySeed: args.authoritySeed,
                        authorityType: args.authorityType,
                        clockSysvar,
                        newAuthority: args.newAuthority,
                        voteAccount,
                    },
                    type: 'authorizeWithSeed',
                }),
            };
        }
        case 11: {
            const args = read(authorizeCheckedWithSeedDecoder);
            return {
                minAccounts: 4,
                toParsed: ([voteAccount, clockSysvar, authorityBaseKey, newAuthority]) => ({
                    info: { ...args, authorityBaseKey, clockSysvar, newAuthority, voteAccount },
                    type: 'authorizeCheckedWithSeed',
                }),
            };
        }
        case 12:
            return voteStateUpdate('compactupdatevotestate', read(compactVoteStateUpdateDecoder));
        case 13: {
            const { hash, update } = read(withSwitchHash(compactVoteStateUpdateDecoder));
            return voteStateUpdate('compactupdatevotestateswitch', update, hash);
        }
        case 14:
            return towerSync('towersync', read(compactTowerSyncDecoder));
        case 15: {
            const { hash, update } = read(withSwitchHash(compactTowerSyncDecoder));
            return towerSync('towersyncswitch', update, hash);
        }
        case 16: {
            const init = read(voteInitV2Decoder);
            return {
                minAccounts: 4,
                toParsed: ([voteAccount, node, inflationRewardsCollector, blockRevenueCollector]) => ({
                    info: {
                        authorizedVoter: init.authorizedVoter,
                        authorizedVoterBlsProofOfPossession: getBase64Decoder().decode(
                            init.authorizedVoterBlsProofOfPossession,
                        ),
                        authorizedVoterBlsPubkey: getBase64Decoder().decode(init.authorizedVoterBlsPubkey),
                        authorizedWithdrawer: init.authorizedWithdrawer,
                        blockRevenueCollector,
                        blockRevenueCommissionBps: init.blockRevenueCommissionBps,
                        inflationRewardsCollector,
                        inflationRewardsCommissionBps: init.inflationRewardsCommissionBps,
                        node,
                        voteAccount,
                    },
                    type: 'initializeV2',
                }),
            };
        }
        case 17: {
            const commissionKind = read(commissionKindDecoder);
            return {
                minAccounts: 3,
                toParsed: ([voteAccount, newCollector, withdrawAuthority]) => ({
                    info: { commissionKind, newCollector, voteAccount, withdrawAuthority },
                    type: 'updateCommissionCollector',
                }),
            };
        }
        case 18: {
            const { commissionBps, commissionKind } = read(
                getStructDecoder([
                    ['commissionBps', getU16Decoder()],
                    ['commissionKind', commissionKindDecoder],
                ]),
            );
            return {
                minAccounts: 2,
                toParsed: ([voteAccount, withdrawAuthority]) => ({
                    info: { commissionBps, commissionKind, voteAccount, withdrawAuthority },
                    type: 'updateCommissionBps',
                }),
            };
        }
        case 19: {
            const deposit = toNumber(read(getU64Decoder()));
            return {
                minAccounts: 2,
                toParsed: ([voteAccount, source]) => ({
                    info: { deposit, source, voteAccount },
                    type: 'depositDelegatorRewards',
                }),
            };
        }
        default:
            return undefined;
    }
}

function legacyVote(type: 'vote' | 'voteSwitch', vote: unknown, hash?: string): DecodedVoteInstruction {
    return {
        minAccounts: 4,
        toParsed: ([voteAccount, slotHashesSysvar, clockSysvar, voteAuthority]) => ({
            info: { ...switchHash(hash), clockSysvar, slotHashesSysvar, vote, voteAccount, voteAuthority },
            type,
        }),
    };
}

function voteStateUpdate(
    type: 'updatevotestate' | 'updatevotestateswitch' | 'compactupdatevotestate' | 'compactupdatevotestateswitch',
    update: unknown,
    hash?: string,
): DecodedVoteInstruction {
    return {
        minAccounts: 2,
        toParsed: ([voteAccount, voteAuthority]) => ({
            info: { ...switchHash(hash), voteAccount, voteAuthority, voteStateUpdate: update },
            type,
        }),
    };
}

function towerSync(type: 'towersync' | 'towersyncswitch', update: unknown, hash?: string): DecodedVoteInstruction {
    return {
        minAccounts: 2,
        toParsed: ([voteAccount, voteAuthority]) => ({
            info: { ...switchHash(hash), towerSync: update, voteAccount, voteAuthority },
            type,
        }),
    };
}

// The RPC only emits the top-level `hash` key on the switch variants.
function switchHash(hash: string | undefined) {
    return hash === undefined ? {} : { hash };
}

function isVoteInstructionType(type: string): type is VoteInstructionType {
    return Object.hasOwn(VOTE_INFO, type);
}

function toVoteParsed(type: VoteInstructionType, info: unknown): VoteParsed {
    // `VOTE_INFO[type]` is a union of structs, which `create` does not accept, and TypeScript cannot pair
    // the validated info with `type`; `VOTE_INFO` keys each struct by its type, which keeps the casts sound.
    return { info: create(info, VOTE_INFO[type] as Struct<VoteParsed['info']>), type } as VoteParsed;
}

// The RPC serialises u64/i64 as JSON numbers, which JSON.parse reads as doubles; Number() matches that.
function toNumber(value: bigint): number {
    return Number(value);
}

const U64_MAX = 0xffff_ffff_ffff_ffffn;

// Bincode `Option<T>`: a u8 tag that must be 0 (None) or 1 (Some).
function getBincodeOptionDecoder<T>(item: Decoder<T>): Decoder<T | null> {
    return createDecoder({
        read(bytes, offset) {
            const [tag, next] = getU8Decoder().read(bytes, offset);
            // eslint-disable-next-line unicorn/no-null -- the RPC serialises a Rust `None` as JSON null
            if (tag === 0) return [null, next];
            if (tag !== 1) throw new Error(`Invalid option tag ${tag}`);
            return item.read(bytes, next);
        },
    });
}

// solana-short-vec length: at most three 7-bit groups, no zero continuation bytes, fits in u16.
const shortVecLengthDecoder = createDecoder<number>({
    read(bytes, offset) {
        let value = 0;
        for (let index = 0; index < 3; index++) {
            const byte = bytes[offset + index];
            if (byte === undefined) throw new Error('Short vec length truncated');
            if (byte === 0 && index !== 0) throw new Error('Short vec length alias');
            if (index === 2 && byte & 0x80) throw new Error('Short vec length too long');
            value |= (byte & 0x7f) << (index * 7);
            if (value > 0xffff) throw new Error('Short vec length overflow');
            if (!(byte & 0x80)) return [value, offset + index + 1];
        }
        throw new Error('Short vec length too long');
    },
});

// Canonical unsigned LEB128 u64, rejecting the same encodings as solana-serde-varint.
const varintU64Decoder = createDecoder<bigint>({
    read(bytes, offset) {
        let value = 0n;
        for (let shift = 0n, index = offset; shift < 64n; shift += 7n, index++) {
            const byte = bytes[index];
            if (byte === undefined) throw new Error('Varint truncated');
            value = (value | (BigInt(byte & 0x7f) << shift)) & U64_MAX;
            if (!(byte & 0x80)) {
                if (Number((value >> shift) & 0xffn) !== byte) throw new Error('Varint last byte truncated');
                if (byte === 0 && (shift !== 0n || value !== 0n)) throw new Error('Varint trailing zeros');
                return [value, index + 1];
            }
        }
        throw new Error('Varint overflows u64');
    },
});

const hashDecoder = transformDecoder(fixDecoderSize(getBytesDecoder(), 32), bytes => getBase58Decoder().decode(bytes));
const slotDecoder = transformDecoder(getU64Decoder(), toNumber);
const timestampDecoder = getBincodeOptionDecoder(transformDecoder(getI64Decoder(), toNumber));
const bincodeStringDecoder = addDecoderSizePrefix(
    getUtf8Decoder({ fatal: true, ignoreBOM: true, removeNullCharacters: false }),
    getU64Decoder(),
);
const byteArray = (size: number) =>
    transformDecoder(fixDecoderSize(getBytesDecoder(), size), bytes => Array.from(bytes));

const BLS_PUBLIC_KEY_SIZE = 48;
const BLS_PROOF_OF_POSSESSION_SIZE = 96;

const voteAuthorizeDecoder = createDecoder<unknown>({
    read(bytes, offset) {
        const [tag, next] = getU32Decoder().read(bytes, offset);
        switch (tag) {
            case 0:
                return ['Voter', next];
            case 1:
                return ['Withdrawer', next];
            case 2: {
                const [args, end] = getStructDecoder([
                    ['bls_pubkey', byteArray(BLS_PUBLIC_KEY_SIZE)],
                    ['bls_proof_of_possession', byteArray(BLS_PROOF_OF_POSSESSION_SIZE)],
                ]).read(bytes, next);
                return [{ VoterWithBLS: args }, end];
            }
            default:
                throw new Error(`Invalid VoteAuthorize tag ${tag}`);
        }
    },
});

const COMMISSION_KINDS = ['InflationRewards', 'BlockRevenue'] as const;
const commissionKindDecoder = transformDecoder(getU32Decoder(), tag => {
    const kind = COMMISSION_KINDS[tag];
    if (!kind) throw new Error(`Invalid CommissionKind tag ${tag}`);
    return kind;
});

const voteInitDecoder = getStructDecoder([
    ['node', getAddressDecoder()],
    ['authorizedVoter', getAddressDecoder()],
    ['authorizedWithdrawer', getAddressDecoder()],
    ['commission', getU8Decoder()],
]);

const voteInitV2Decoder = getStructDecoder([
    ['node', getAddressDecoder()],
    ['authorizedVoter', getAddressDecoder()],
    ['authorizedVoterBlsPubkey', fixDecoderSize(getBytesDecoder(), BLS_PUBLIC_KEY_SIZE)],
    ['authorizedVoterBlsProofOfPossession', fixDecoderSize(getBytesDecoder(), BLS_PROOF_OF_POSSESSION_SIZE)],
    ['authorizedWithdrawer', getAddressDecoder()],
    ['inflationRewardsCommissionBps', getU16Decoder()],
    ['blockRevenueCommissionBps', getU16Decoder()],
]);

const authorizeDecoder = getStructDecoder([
    ['newAuthority', getAddressDecoder()],
    ['authorityType', voteAuthorizeDecoder],
]);

const authorizeCheckedWithSeedDecoder = getStructDecoder([
    ['authorityType', voteAuthorizeDecoder],
    ['authorityOwner', getAddressDecoder()],
    ['authoritySeed', bincodeStringDecoder],
]);

const authorizeWithSeedDecoder = getStructDecoder([
    ['authorityType', voteAuthorizeDecoder],
    ['authorityOwner', getAddressDecoder()],
    ['authoritySeed', bincodeStringDecoder],
    ['newAuthority', getAddressDecoder()],
]);

const voteDecoder = getStructDecoder([
    ['slots', getArrayDecoder(slotDecoder, { size: getU64Decoder() })],
    ['hash', hashDecoder],
    ['timestamp', timestampDecoder],
]);

const voteStateUpdateDecoder = getStructDecoder([
    [
        'lockouts',
        getArrayDecoder(
            getStructDecoder([
                ['slot', slotDecoder],
                ['confirmation_count', getU32Decoder()],
            ]),
            { size: getU64Decoder() },
        ),
    ],
    ['root', getBincodeOptionDecoder(slotDecoder)],
    ['hash', hashDecoder],
    ['timestamp', timestampDecoder],
]);

// Compact layout shared by `CompactUpdateVoteState` and `TowerSync`: a u64 root where u64::MAX means
// none, then lockouts as varint slot offsets from the previous slot (starting at the root, or 0).
const compactLockoutsDecoder = getStructDecoder([
    ['root', getU64Decoder()],
    [
        'offsets',
        getArrayDecoder(
            getStructDecoder([
                ['offset', varintU64Decoder],
                ['confirmationCount', getU8Decoder()],
            ]),
            { size: shortVecLengthDecoder },
        ),
    ],
]);

const expandedLockoutsDecoder = transformDecoder(compactLockoutsDecoder, ({ offsets, root }) => {
    const hasRoot = root !== U64_MAX;
    let slot = hasRoot ? root : 0n;
    const lockouts = offsets.map(({ confirmationCount, offset }) => {
        slot += offset;
        if (slot > U64_MAX) throw new Error('Invalid lockout offset');
        return { confirmation_count: confirmationCount, slot: toNumber(slot) };
    });
    // eslint-disable-next-line unicorn/no-null -- the RPC serialises a Rust `None` as JSON null
    return { lockouts, root: hasRoot ? toNumber(root) : null };
});

const compactVoteStateUpdateDecoder = transformDecoder(
    getStructDecoder([
        ['tower', expandedLockoutsDecoder],
        ['hash', hashDecoder],
        ['timestamp', timestampDecoder],
    ]),
    ({ hash, timestamp, tower }) => ({ ...tower, hash, timestamp }),
);

const compactTowerSyncDecoder = transformDecoder(
    getStructDecoder([
        ['tower', expandedLockoutsDecoder],
        ['hash', hashDecoder],
        ['timestamp', timestampDecoder],
        ['blockId', hashDecoder],
    ]),
    ({ blockId, hash, timestamp, tower }) => ({ ...tower, blockId, hash, timestamp }),
);

function withSwitchHash<T>(update: Decoder<T>) {
    return getStructDecoder([
        ['update', update],
        ['hash', hashDecoder],
    ]);
}
