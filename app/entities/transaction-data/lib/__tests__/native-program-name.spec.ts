import { camelToTitleCase } from '@utils/index';

import { resolveNativeProgramInstructionName } from '../native-program-name';

const VOTE_PROGRAM = 'Vote111111111111111111111111111111111111111';
const UPGRADEABLE_LOADER = 'BPFLoaderUpgradeab1e11111111111111111111111';
const BPF_LOADER_2 = 'BPFLoader2111111111111111111111111111111111';

const INSTRUCTION_ARGS = [1, 0, 0, 0, 0, 0, 0, 0];

function name(programId: string, bytes: number[]): string | undefined {
    return resolveNativeProgramInstructionName({ data: Uint8Array.from(bytes), programId });
}

describe('resolveNativeProgramInstructionName', () => {
    // Tags are bincode u32 little-endian; the expected words are agave's `parse_vote` and
    // `parse_bpf_loader` instruction types.
    it.each([
        [VOTE_PROGRAM, 0, 'initialize'],
        [VOTE_PROGRAM, 1, 'authorize'],
        [VOTE_PROGRAM, 2, 'vote'],
        [VOTE_PROGRAM, 3, 'withdraw'],
        [VOTE_PROGRAM, 4, 'updateValidatorIdentity'],
        [VOTE_PROGRAM, 5, 'updateCommission'],
        [VOTE_PROGRAM, 6, 'voteSwitch'],
        [VOTE_PROGRAM, 7, 'authorizeChecked'],
        [VOTE_PROGRAM, 8, 'updatevotestate'],
        [VOTE_PROGRAM, 9, 'updatevotestateswitch'],
        [VOTE_PROGRAM, 10, 'authorizeWithSeed'],
        [VOTE_PROGRAM, 11, 'authorizeCheckedWithSeed'],
        [VOTE_PROGRAM, 12, 'compactupdatevotestate'],
        [VOTE_PROGRAM, 13, 'compactupdatevotestateswitch'],
        [VOTE_PROGRAM, 14, 'towersync'],
        [VOTE_PROGRAM, 15, 'towersyncswitch'],
        [VOTE_PROGRAM, 16, 'initializeV2'],
        [VOTE_PROGRAM, 17, 'updateCommissionCollector'],
        [VOTE_PROGRAM, 18, 'updateCommissionBps'],
        [VOTE_PROGRAM, 19, 'depositDelegatorRewards'],
        [UPGRADEABLE_LOADER, 0, 'initializeBuffer'],
        [UPGRADEABLE_LOADER, 1, 'write'],
        [UPGRADEABLE_LOADER, 2, 'deployWithMaxDataLen'],
        [UPGRADEABLE_LOADER, 3, 'upgrade'],
        [UPGRADEABLE_LOADER, 4, 'setAuthority'],
        [UPGRADEABLE_LOADER, 5, 'close'],
        [UPGRADEABLE_LOADER, 6, 'extendProgram'],
        [UPGRADEABLE_LOADER, 7, 'setAuthorityChecked'],
        [BPF_LOADER_2, 0, 'write'],
        [BPF_LOADER_2, 1, 'finalize'],
    ])('should word %s tag %i as the RPC type %s', (programId, tag, rpcType) => {
        expect(name(programId, [tag, 0, 0, 0, ...INSTRUCTION_ARGS])).toBe(camelToTitleCase(rpcType));
    });

    it('should read the tag from a lookup that starts inside a larger buffer', () => {
        const buffer = Uint8Array.from([9, 9, 14, 0, 0, 0]);

        expect(resolveNativeProgramInstructionName({ data: buffer.subarray(2), programId: VOTE_PROGRAM })).toBe(
            'Towersync',
        );
    });

    it.each([
        ['a Vote tag past the last instruction', VOTE_PROGRAM, [20, 0, 0, 0]],
        ['a loader tag past the last instruction', UPGRADEABLE_LOADER, [8, 0, 0, 0]],
        ['a BPF Loader 2 tag past the last instruction', BPF_LOADER_2, [2, 0, 0, 0]],
        ['tag 256, whose low byte is 0', VOTE_PROGRAM, [0, 1, 0, 0]],
        ['data shorter than a tag', VOTE_PROGRAM, [14, 0, 0]],
        ['another program', '11111111111111111111111111111111', [2, 0, 0, 0]],
    ])('should return undefined for %s', (_label, programId, bytes) => {
        expect(name(programId, bytes)).toBeUndefined();
    });
});
