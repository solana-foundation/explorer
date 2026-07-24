import { describe, expect, it } from 'vitest';

import { TOKEN_2022_PROGRAM_ID } from '../../constants.js';
import { asRecord } from '../../parse-helpers.js';
import type { AccountPayloadContext } from '../../types.js';
import { buildSplToken2022MultisigPayload } from '../spl-token-2022-multisig.js';

const KIND = 'spl-token-2022:multisig';

function makeContext(parsedInfo: Record<string, unknown> | null): AccountPayloadContext {
    return {
        account: {
            owner: TOKEN_2022_PROGRAM_ID,
            parsedData: parsedInfo ? { info: parsedInfo } : null,
            parsedProgram: 'spl-token-2022',
            rawDataBytes: null,
        },
        kind: KIND,
    };
}

function entityOf(payload: Record<string, unknown>): Record<string, unknown> {
    const entity = asRecord(payload.entity);
    if (!entity) {
        throw new Error('payload.entity is not a record');
    }
    return entity;
}

describe('buildSplToken2022MultisigPayload', () => {
    it('should extract all multisig fields from parsedData.info', () => {
        const signers = ['Signer111', 'Signer222'];
        const result = buildSplToken2022MultisigPayload(
            makeContext({ isInitialized: true, numRequiredSigners: 1, numValidSigners: 2, signers }),
        );
        expect(result).toMatchObject({
            entity: {
                is_initialized: true,
                kind: KIND,
                num_required_signers: 1,
                num_valid_signers: 2,
                signers,
                token_program: TOKEN_2022_PROGRAM_ID,
            },
        });
    });

    it('should return null for all fields when parsedData is null', () => {
        const result = buildSplToken2022MultisigPayload(makeContext(null));
        const entity = entityOf(result);
        expect(entity.is_initialized).toBeNull();
        expect(entity.num_required_signers).toBeNull();
        expect(entity.num_valid_signers).toBeNull();
        expect(entity.signers).toBeNull();
    });

    it('should filter non-string signers', () => {
        const result = buildSplToken2022MultisigPayload(
            makeContext({
                isInitialized: true,
                numRequiredSigners: 1,
                numValidSigners: 1,
                signers: ['Valid111', null, 42],
            }),
        );
        expect(entityOf(result).signers).toEqual(['Valid111']);
    });

    it('should use TOKEN_2022_PROGRAM_ID as token_program', () => {
        const result = buildSplToken2022MultisigPayload(
            makeContext({ isInitialized: false, numRequiredSigners: 0, numValidSigners: 0, signers: [] }),
        );
        expect(entityOf(result).token_program).toBe(TOKEN_2022_PROGRAM_ID);
    });
});
