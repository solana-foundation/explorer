import { Account } from '@providers/accounts';
import {
    decodeAttestation,
    decodeCredential,
    decodeSchema,
    SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS as SAS_PROGRAM_ID,
} from 'sas-lib';

export function decodeWithType(
    account: Account,
    type: 'attestation' | 'credential' | 'schema',
    func: typeof decodeAttestation | typeof decodeCredential | typeof decodeSchema,
) {
    try {
        const input = {
            address: account.pubkey.toBase58(),
            data: Uint8Array.from(account.data.raw || new Uint8Array()),
        };
        const data = (func as any)(input as any);
        return { data, type };
    } catch (_e) {
        // pass
        return null;
    }
}

export function decodeAccount(account: Account) {
    const attestation = decodeWithType(account, 'attestation', decodeAttestation);
    if (attestation) {
        return attestation;
    }

    const credential = decodeWithType(account, 'credential', decodeCredential);
    if (credential) {
        return credential;
    }

    const schema = decodeWithType(account, 'schema', decodeSchema);
    if (schema) {
        return schema;
    }

    return null;
}

export function isAttestationAccount(account: Account) {
    try {
        const accountType = decodeAccount(account)?.type;
        return (
            account.owner.toBase58() === SAS_PROGRAM_ID && (accountType === 'attestation' || accountType === 'schema')
        );
    } catch (_e) {
        return false;
    }
}
