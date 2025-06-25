import { Account } from '@providers/accounts';
import { deserialize } from 'borsh';
import {
    convertSasSchemaToBorshSchema,
    decodeAttestation,
    decodeCredential,
    decodeSchema,
    Schema as SasSchema,
    SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS as SAS_PROGRAM_ID,
} from 'sas-lib';

export function decodeWithType(
    account: Account,
    type: 'attestation' | 'credential' | 'schema',
    func: typeof decodeAttestation | typeof decodeCredential | typeof decodeSchema
) {
    try {
        const input = {
            address: account.pubkey.toBase58(),
            data: Uint8Array.from(account.data.raw || new Uint8Array()),
        };
        const data = (func as any)(input as any);
        return { data, type };
    } catch (e) {
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
    } catch (e) {
        return false;
    }
}

// Helper function to deserialize attestation data using the borsh@0.7.0 API
// This is annoying because sas-lib relies on @solana/kit which uses borsh@2.0.0 but metaplex & other libraries use borsh@0.7.0
// This is a workaround to get the data deserialized correctly.
export function deserializeAttestationDataWithBorsh070(schema: SasSchema, data: Uint8Array) {
    // 1. Use sas-lib to convert its schema into a borsh-compatible format.
    const sasBorshSchema = convertSasSchemaToBorshSchema(schema);
    // @ts-expect-error borsh@0.7.0 actually exposes private schema field, even though it's not typed
    const fields = Object.entries(sasBorshSchema.schema.struct);

    // 2. We must dynamically create a class that has the properties defined in the schema.
    const DynamicAttestationData = class {
        constructor(properties: any) {
            Object.keys(properties).forEach(key => {
                (this as any)[key] = properties[key];
            });
        }
    };

    // Add properties to the class prototype from the schema fields
    fields.forEach(([fieldName]) => {
        Object.defineProperty(DynamicAttestationData.prototype, fieldName, {
            enumerable: true,
            writable: true,
        });
    });

    // 3. The borsh@0.7.0 deserialize function requires a Map object
    // where the key is the class and the value is the schema definition.
    const schemaMap = new Map<any, any>();
    const borsh070Schema = {
        fields: fields,
        kind: 'struct',
    };
    schemaMap.set(DynamicAttestationData, borsh070Schema);

    // 4. Call borsh@0.7.0's deserialize function with the correct arguments.
    // It will return an instance of DynamicAttestationData with populated fields.
    return deserialize(schemaMap, DynamicAttestationData, Buffer.from(data));
}
