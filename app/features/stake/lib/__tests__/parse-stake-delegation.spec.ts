import { describe, expect, it } from 'vitest';

import {
    makeNonceAccount,
    makeOtherProgramAccount,
    makeStakeAccount,
    makeUndelegatedStakeAccount,
    makeUnparsedAccount,
} from '../../__fixtures__/stake-account';
import { parseStakeDelegation } from '../parse-stake-delegation';

describe('parseStakeDelegation', () => {
    it('should read both epochs from a deactivated stake account', () => {
        expect(parseStakeDelegation(makeStakeAccount({ deactivationEpoch: '1000' }))).toEqual({
            activationEpoch: 943,
            deactivationEpoch: 1000,
            kind: 'delegated',
        });
    });

    it('should report no deactivation epoch while the account is still delegated', () => {
        expect(parseStakeDelegation(makeStakeAccount())).toEqual({
            activationEpoch: 943,
            deactivationEpoch: undefined,
            kind: 'delegated',
        });
    });

    it('should report a missing account as not found', () => {
        expect(parseStakeDelegation(null)).toEqual({ kind: 'not-found' });
        expect(parseStakeDelegation(undefined)).toEqual({ kind: 'not-found' });
    });

    it('should report an account the RPC could not parse as not a stake account', () => {
        expect(parseStakeDelegation(makeUnparsedAccount())).toEqual({ kind: 'not-a-stake-account' });
    });

    it('should report a parsed account of another program as not a stake account', () => {
        expect(parseStakeDelegation(makeOtherProgramAccount())).toEqual({ kind: 'not-a-stake-account' });
    });

    it('should report a nonce account as not a stake account, though jsonParsed also calls it initialized', () => {
        expect(parseStakeDelegation(makeNonceAccount())).toEqual({ kind: 'not-a-stake-account' });
    });

    it('should report an initialized stake account with no delegation as undelegated', () => {
        expect(parseStakeDelegation(makeUndelegatedStakeAccount())).toEqual({ kind: 'undelegated' });
    });
});
