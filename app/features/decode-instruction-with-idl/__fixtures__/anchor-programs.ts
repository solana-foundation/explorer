import { gen } from '@__fixtures__/gen';
import { makeInstruction } from '@__fixtures__/instruction';
import { type Idl, Program } from '@coral-xyz/anchor';
import anchor030Devi from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import { getProvider } from '@entities/idl/model/anchor/anchor-provider';
import type { ProgramEventPayload } from '@entities/program-logs';

const SAMPLE_DISCRIMINATOR = [1, 2, 3, 4, 5, 6, 7, 8];
// discriminator + amount: u64 LE (1_000_000_000) + counter: u32 LE (42)
const sampleEventBytes = Buffer.from([...SAMPLE_DISCRIMINATOR, 0x00, 0xca, 0x9a, 0x3b, 0, 0, 0, 0, 0x2a, 0, 0, 0]);

export const sampleEvent: ProgramEventPayload = { data: sampleEventBytes.toString('base64'), kind: 'data' };

export const sampleProgram = {
    idl: {
        accounts: [],
        address: '11111111111111111111111111111111',
        events: [{ discriminator: SAMPLE_DISCRIMINATOR, name: 'sampleEvent' }],
        instructions: [],
        metadata: { name: 'sample_program', spec: '0.1.0', version: '0.1.0' },
        types: [
            {
                name: 'sampleEvent',
                type: {
                    fields: [
                        { name: 'amount', type: 'u64' },
                        { name: 'counter', type: 'u32' },
                    ],
                    kind: 'struct',
                },
            },
        ],
    },
} as unknown as Program;

export const ammV3Program = new Program(anchor030Devi as Idl, getProvider('https://api.devnet.solana.com'));

// update_reward_infos has no args and one pool_state account, so it is the smallest instruction to decode.
export const UPDATE_REWARD_INFOS_DISCRIMINATOR = [163, 172, 224, 52, 11, 154, 106, 223];

export function ammV3Instruction(data: Uint8Array | number[], key = gen.publicKey(1)) {
    return makeInstruction({ data, keys: [key], programId: ammV3Program.programId, writable: true });
}
