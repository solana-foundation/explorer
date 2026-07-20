import { describe, expect, it } from 'vitest';

import { TOKEN_PROGRAM_ID } from '../../constants.js';
import { asRecord } from '../../parse-helpers.js';
import type { AccountPayloadContext } from '../../types.js';
import { buildSplTokenMultisigPayload } from '../spl-token-multisig.js';

const KIND = 'spl-token:multisig';

function makeContext(parsedInfo: Record<string, unknown> | null): AccountPayloadContext {
    return {
        account: {
            owner: TOKEN_PROGRAM_ID,
            parsedData: parsedInfo ? { info: parsedInfo } : null,
            parsedProgram: 'spl-token',
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

describe('buildSplTokenMultisigPayload', () => {
    it('should extract all multisig fields from parsedData.info', () => {
        const signers = [
            'Signer1111111111111111111111111111111111111',
            'Signer2222222222222222222222222222222222222',
            'Signer3333333333333333333333333333333333333',
        ];
        const result = buildSplTokenMultisigPayload(
            makeContext({ isInitialized: true, numRequiredSigners: 2, numValidSigners: 3, signers }),
        );
        expect(result).toMatchObject({
            entity: {
                is_initialized: true,
                kind: KIND,
                num_required_signers: 2,
                num_valid_signers: 3,
                signers,
                token_program: TOKEN_PROGRAM_ID,
            },
        });
    });

    it('should expose token_program from account.owner', () => {
        const result = buildSplTokenMultisigPayload(
            makeContext({ isInitialized: true, numRequiredSigners: 1, numValidSigners: 1, signers: [] }),
        );
        expect(entityOf(result).token_program).toBe(TOKEN_PROGRAM_ID);
    });

    it('should return null for all multisig fields when parsedData is null without throwing', () => {
        const result = buildSplTokenMultisigPayload(makeContext(null));
        const entity = entityOf(result);
        expect(entity.is_initialized).toBeNull();
        expect(entity.num_required_signers).toBeNull();
        expect(entity.num_valid_signers).toBeNull();
        expect(entity.signers).toBeNull();
    });

    it('should return empty array for empty signers', () => {
        const result = buildSplTokenMultisigPayload(
            makeContext({ isInitialized: false, numRequiredSigners: 0, numValidSigners: 0, signers: [] }),
        );
        expect(entityOf(result).signers).toEqual([]);
    });

    it('should filter out non-string entries from signers array', () => {
        const result = buildSplTokenMultisigPayload(
            makeContext({
                isInitialized: true,
                numRequiredSigners: 1,
                numValidSigners: 1,
                signers: ['ValidPubkey111111111111111111111111111111111', null, 42, undefined],
            }),
        );
        expect(entityOf(result).signers).toEqual(['ValidPubkey111111111111111111111111111111111']);
    });
});
