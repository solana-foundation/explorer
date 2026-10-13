import { getU32Decoder, type ReadonlyUint8Array } from '@solana/kit';

import type { SerumInstructionKey } from './decoder';
import { DEPRECATED_SERUM_PROGRAM_IDS, SERUM_PROGRAM_IDS } from './program-ids';

const programIds = new Set<string>(SERUM_PROGRAM_IDS);
const deprecatedProgramIds = new Set<string>(DEPRECATED_SERUM_PROGRAM_IDS);

export const isSerumProgramId = (programId: string): boolean => programIds.has(programId);

export const isDeprecatedSerumProgram = (programId: string): boolean => deprecatedProgramIds.has(programId);

/** Every instruction the DEX program names: the decodable keys plus the four codes with no vendored layout. */
export type SerumInstructionName = SerumInstructionKey | 'disableMarket' | 'newOrderV2' | 'sendTake' | 'sweepFees';

export const SERUM_INSTRUCTION_NAMES: Record<SerumInstructionName, string> = {
    cancelOrder: 'Cancel Order',
    cancelOrderByClientId: 'Cancel Order by Client Id',
    cancelOrderByClientIdV2: 'Cancel Order by Client Id v2',
    cancelOrderV2: 'Cancel Order v2',
    closeOpenOrders: 'Close Open Orders',
    consumeEvents: 'Consume Events',
    consumeEventsPermissioned: 'Consume Events Permissioned',
    disableMarket: 'Disable Market',
    initOpenOrders: 'Init Open Orders',
    initializeMarket: 'Initialize Market',
    matchOrders: 'Match Orders',
    newOrder: 'New Order',
    newOrderV2: 'New Order v2',
    newOrderV3: 'New Order v3',
    prune: 'Prune',
    sendTake: 'Send Take',
    settleFunds: 'Settle Funds',
    sweepFees: 'Sweep Fees',
};

const SERUM_CODE_LOOKUP: { [key: number]: SerumInstructionName } = {
    0: 'initializeMarket',
    1: 'newOrder',
    10: 'newOrderV3',
    11: 'cancelOrderV2',
    12: 'cancelOrderByClientIdV2',
    13: 'sendTake',
    14: 'closeOpenOrders',
    15: 'initOpenOrders',
    16: 'prune',
    17: 'consumeEventsPermissioned',
    2: 'matchOrders',
    3: 'consumeEvents',
    4: 'cancelOrder',
    5: 'settleFunds',
    6: 'cancelOrderByClientId',
    7: 'disableMarket',
    8: 'sweepFees',
    9: 'newOrderV2',
};

// Serum keys its instructions by a version byte followed by a u32 LE instruction code.
const readInstructionCode = (data: ReadonlyUint8Array): number => getU32Decoder().decode(data, 1);

/** A name the DEX program defines but whose layout is not vendored, so it can only be shown by name. */
export type UndecodableSerumInstructionName = Exclude<SerumInstructionName, SerumInstructionKey>;

const undecodableNames = new Set<SerumInstructionName>(['disableMarket', 'newOrderV2', 'sendTake', 'sweepFees']);

export const isUndecodableSerumInstructionName = (
    name: SerumInstructionName,
): name is UndecodableSerumInstructionName => undecodableNames.has(name);

// Never throws, so it composes with other resolvers; undefined when the data holds no readable, recognized code.
export const resolveSerumInstructionKey = (data: ReadonlyUint8Array): SerumInstructionName | undefined =>
    data.byteLength < 5 ? undefined : SERUM_CODE_LOOKUP[readInstructionCode(data)];

// Name-only resolver for the NAME_SOURCES chain: program-id-gated and never throws, so it composes with other resolvers.
export const resolveSerumInstructionName = (
    programId: string,
    discriminator: ReadonlyUint8Array,
): string | undefined => {
    if (!programIds.has(programId)) return undefined;
    const key = resolveSerumInstructionKey(discriminator);
    return key === undefined ? undefined : SERUM_INSTRUCTION_NAMES[key];
};

export const parseSerumInstructionTitle = (programId: string, data: ReadonlyUint8Array): string => {
    const title = resolveSerumInstructionName(programId, data);
    if (title === undefined) {
        throw new Error(
            data.byteLength < 5
                ? `Serum instruction data too short (${data.byteLength} bytes)`
                : `Unrecognized Serum instruction code: ${readInstructionCode(data)}`,
        );
    }
    return title;
};

export {
    DEPRECATED_SERUM_PROGRAM_IDS,
    OPEN_BOOK_PROGRAM_IDS,
    OPENBOOK_DEX_PROGRAM_LABEL,
    SERUM_DEX_V1_PROGRAM_IDS,
    SERUM_DEX_V1_PROGRAM_LABEL,
    SERUM_DEX_V1B_PROGRAM_IDS,
    SERUM_DEX_V2_PROGRAM_IDS,
    SERUM_DEX_V2_PROGRAM_LABEL,
    SERUM_DEX_V3_PROGRAM_IDS,
    SERUM_DEX_V3_PROGRAM_LABEL,
    SERUM_PROGRAM_IDS,
} from './program-ids';
