import { describe, expect, it } from 'vitest';

import { NATIVE_LOADER_PROGRAM_ID, SYSTEM_PROGRAM_ID } from '../../../shared/constants.js';
import type { AccountPayloadContext } from '../../types.js';
import { buildNativeProgramPayload } from '../native-program.js';

describe('native-program account kind payload', () => {
    it('should prefer the injected resolver for the address label', () => {
        const context: AccountPayloadContext = {
            account: {
                address: SYSTEM_PROGRAM_ID,
                executable: true,
                owner: NATIVE_LOADER_PROGRAM_ID,
                parsedData: null,
                parsedProgram: null,
                rawDataBytes: null,
            },
            kind: 'native-program',
            resolveProgramName: () => 'Registry System Program',
        };

        expect(buildNativeProgramPayload(context)).toEqual({
            entity: {
                address: SYSTEM_PROGRAM_ID,
                address_label: 'Registry System Program',
                executable: true,
                kind: 'native-program',
            },
        });
    });

    it('should fall back to the kind-qualified address without an injected resolver', () => {
        const context: AccountPayloadContext = {
            account: {
                address: SYSTEM_PROGRAM_ID,
                executable: true,
                owner: NATIVE_LOADER_PROGRAM_ID,
                parsedData: null,
                parsedProgram: null,
                rawDataBytes: null,
            },
            kind: 'native-program',
        };

        expect(buildNativeProgramPayload(context)).toEqual({
            entity: {
                address: SYSTEM_PROGRAM_ID,
                address_label: null,
                executable: true,
                kind: 'native-program',
            },
        });
    });

    it('should default missing account fields to null', () => {
        const context: AccountPayloadContext = {
            account: { owner: NATIVE_LOADER_PROGRAM_ID, parsedData: null, parsedProgram: null, rawDataBytes: null },
            kind: 'native-program',
        };

        expect(buildNativeProgramPayload(context)).toEqual({
            entity: {
                address: null,
                address_label: null,
                executable: null,
                kind: 'native-program',
            },
        });
    });
});
