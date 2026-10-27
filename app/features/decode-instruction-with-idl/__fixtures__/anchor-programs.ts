import { gen } from '@__fixtures__/gen';
import { makeInstruction } from '@__fixtures__/instruction';
import { type Idl, Program } from '@coral-xyz/anchor';
import anchor030Devi from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import { getProvider } from '@entities/idl/model/anchor/anchor-provider';

export const ammV3Program = new Program(anchor030Devi as Idl, getProvider('https://api.devnet.solana.com'));

// update_reward_infos has no args and one pool_state account, so it is the smallest instruction to decode.
export const UPDATE_REWARD_INFOS_DISCRIMINATOR = [163, 172, 224, 52, 11, 154, 106, 223];

export function ammV3Instruction(data: Uint8Array | number[], key = gen.publicKey(1)) {
    return makeInstruction({ data, keys: [key], programId: ammV3Program.programId, writable: true });
}
