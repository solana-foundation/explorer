import {
    AccountRole,
    type Address,
    address,
    getAddressDecoder,
    getBase16Codec,
    type ReadonlyUint8Array,
} from '@solana/kit';

import type { SerumInstruction } from '../decoder';
import {
    OPEN_BOOK_PROGRAM_IDS,
    SERUM_DEX_V1_PROGRAM_IDS,
    SERUM_DEX_V1B_PROGRAM_IDS,
    SERUM_DEX_V2_PROGRAM_IDS,
    SERUM_DEX_V3_PROGRAM_IDS,
} from '../program-ids';

const hex = (value: string) => getBase16Codec().encode(value);

export const SERUM_PROGRAM_IDS_BY_NAME = {
    dexV1: address(SERUM_DEX_V1_PROGRAM_IDS.mainnet),
    dexV1b: address(SERUM_DEX_V1B_PROGRAM_IDS.mainnet),
    dexV2: address(SERUM_DEX_V2_PROGRAM_IDS.mainnet),
    dexV3: address(SERUM_DEX_V3_PROGRAM_IDS.mainnet),
    openBook: address(OPEN_BOOK_PROGRAM_IDS.mainnet),
} as const;

// Bytes produced by @project-serum/serum 0.13.61 `encodeInstruction`, frozen so the vendored layout is checked
// against the original encoder rather than against itself. Variants 7/8/9/13 have no layout — use
// makeRawInstructionData for those.
export const ENCODED_INSTRUCTIONS = {
    cancelOrder: hex(
        '000400000001000000ffffffffffffffffffffffffffffff7f000000000000000000000000000000000000000000000000000000000000000003',
    ),
    cancelOrderByClientId: hex('00060000006300000000000000'),
    cancelOrderByClientIdV2: hex('000c0000007b00000000000000'),
    cancelOrderV2: hex('000b00000000000000ffffffffffffffffffffffffffffff7f'),
    closeOpenOrders: hex('000e000000'),
    consumeEvents: hex('00030000001000'),
    consumeEventsPermissioned: hex('00110000002000'),
    initOpenOrders: hex('000f000000'),
    initializeMarket: hex('0000000000e8030000000000000a00000000000000190000000000000000006400000000000000'),
    matchOrders: hex('00020000000500'),
    newOrder: hex('00010000000000000050c30000000000000a00000000000000000000000700000000000000'),
    newOrderV3: hex(
        '000a0000000100000060ea0000000000000500000000000000e09304000000000000000000020000002a00000000000000ffff',
    ),
    prune: hex('00100000001900'),
    settleFunds: hex('0005000000'),
} as const;

// Version byte 0 + u32 LE code only — for the variants encodeInstruction can't build (7/8/9/13).
export function makeRawInstructionData(code: number): Uint8Array {
    const data = new Uint8Array(5);
    new DataView(data.buffer).setUint32(1, code, true);
    return data;
}

/** 14 keys — enough for the largest decoder (initializeMarket reads keys[0..12]). */
export const TEST_KEYS: Address[] = Array.from({ length: 14 }, (_, index) =>
    getAddressDecoder().decode(new Uint8Array(32).fill(index + 1)),
);

export function makeInstruction(
    data: ReadonlyUint8Array,
    programAddress: Address,
    keys: Address[] = TEST_KEYS,
): SerumInstruction {
    return {
        accounts: keys.map(key => ({ address: key, role: AccountRole.READONLY })),
        data,
        programAddress,
    };
}
