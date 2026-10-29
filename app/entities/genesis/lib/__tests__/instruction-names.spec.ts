import { describe, expect, it } from 'vitest';

import { GENESIS_PROGRAM_ADDRESS, resolveGenesisInstructionName } from '../instruction-names';

describe('resolveGenesisInstructionName', () => {
    // Discriminators from genesis-vesting-kit README, "Program and IDL", and the Genesis SDK.
    it.each([
        [116, 'ClaimClaimScheduleV2'],
        [44, 'TriggerBehaviorsV2'],
        [129, 'BurnRaydiumCpmmLpTokensV2'],
        [255, 'EmitEvent'],
    ])('should resolve discriminator %i to %s', (discriminator, name) => {
        expect(resolveGenesisInstructionName(GENESIS_PROGRAM_ADDRESS, Uint8Array.from([discriminator, 0]))).toBe(name);
    });

    it('should leave the IDL position of EmitEvent unnamed, because the program sends 255', () => {
        expect(resolveGenesisInstructionName(GENESIS_PROGRAM_ADDRESS, Uint8Array.from([130]))).toBeUndefined();
    });

    it('should return undefined for another program or empty data', () => {
        expect(
            resolveGenesisInstructionName('11111111111111111111111111111111', Uint8Array.from([116])),
        ).toBeUndefined();
        expect(resolveGenesisInstructionName(GENESIS_PROGRAM_ADDRESS, new Uint8Array())).toBeUndefined();
    });
});
