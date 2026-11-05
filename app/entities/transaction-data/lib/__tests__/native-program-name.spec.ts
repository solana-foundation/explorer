import { camelToTitleCase } from '@utils/index';

import { resolveNativeProgramInstructionName } from '../native-program-name';

const VOTE_PROGRAM = 'Vote111111111111111111111111111111111111111';
const UPGRADEABLE_LOADER = 'BPFLoaderUpgradeab1e11111111111111111111111';
const BPF_LOADER_2 = 'BPFLoader2111111111111111111111111111111111';

function name(programId: string, bytes: number[]): string | undefined {
    return resolveNativeProgramInstructionName({ data: Uint8Array.from(bytes), programId });
}

describe('resolveNativeProgramInstructionName', () => {
    // Tags are bincode u32 little-endian; the expected words are agave's `parse_vote` and
    // `parse_bpf_loader` instruction types.
    it.each([
        ['initialize', VOTE_PROGRAM, [0, 0, 0, 0]],
        ['withdraw', VOTE_PROGRAM, [3, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]],
        ['authorizeChecked', VOTE_PROGRAM, [7, 0, 0, 0, 1, 0, 0, 0]],
        ['compactupdatevotestate', VOTE_PROGRAM, [12, 0, 0, 0]],
        ['towersync', VOTE_PROGRAM, [14, 0, 0, 0]],
        ['depositDelegatorRewards', VOTE_PROGRAM, [19, 0, 0, 0]],
        ['initializeBuffer', UPGRADEABLE_LOADER, [0, 0, 0, 0]],
        ['write', UPGRADEABLE_LOADER, [1, 0, 0, 0, 0, 0, 0, 0]],
        ['upgrade', UPGRADEABLE_LOADER, [3, 0, 0, 0]],
        ['setAuthorityChecked', UPGRADEABLE_LOADER, [7, 0, 0, 0]],
        ['write', BPF_LOADER_2, [0, 0, 0, 0, 0, 0, 0, 0]],
        ['finalize', BPF_LOADER_2, [1, 0, 0, 0]],
    ])('should word %s as the RPC does', (rpcType, programId, bytes) => {
        expect(name(programId, bytes)).toBe(camelToTitleCase(rpcType));
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
        ['data shorter than a tag', VOTE_PROGRAM, [14, 0, 0]],
        ['another program', '11111111111111111111111111111111', [2, 0, 0, 0]],
    ])('should return undefined for %s', (_label, programId, bytes) => {
        expect(name(programId, bytes)).toBeUndefined();
    });
});
