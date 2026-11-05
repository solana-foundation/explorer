import { camelToTitleCase } from '@utils/index';

import { readUint32LE } from '@/app/shared/lib/bytes';

import type { InstructionNameLookup } from './types';

// The RPC's `parsed.type` for each bincode u32 tag, in enum order. These programs ship no generated
// client, and a name from bytes must read the same as the name the RPC gives the same instruction.
const RPC_TYPES_BY_TAG: Partial<Record<string, readonly string[]>> = {
    BPFLoader2111111111111111111111111111111111: ['write', 'finalize'],
    BPFLoaderUpgradeab1e11111111111111111111111: [
        'initializeBuffer',
        'write',
        'deployWithMaxDataLen',
        'upgrade',
        'setAuthority',
        'close',
        'extendProgram',
        'setAuthorityChecked',
    ],
    Vote111111111111111111111111111111111111111: [
        'initialize',
        'authorize',
        'vote',
        'withdraw',
        'updateValidatorIdentity',
        'updateCommission',
        'voteSwitch',
        'authorizeChecked',
        'updatevotestate',
        'updatevotestateswitch',
        'authorizeWithSeed',
        'authorizeCheckedWithSeed',
        'compactupdatevotestate',
        'compactupdatevotestateswitch',
        'towersync',
        'towersyncswitch',
        'initializeV2',
        'updateCommissionCollector',
        'updateCommissionBps',
        'depositDelegatorRewards',
    ],
};

const TAG_BYTES = 4;

export function resolveNativeProgramInstructionName({ programId, data }: InstructionNameLookup): string | undefined {
    const rpcTypes = RPC_TYPES_BY_TAG[programId];
    if (!rpcTypes || data.length < TAG_BYTES) return undefined;

    const rpcType = rpcTypes[readUint32LE(data, 0)];
    return rpcType === undefined ? undefined : camelToTitleCase(rpcType);
}
