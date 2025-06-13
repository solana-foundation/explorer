import { AccountAddressRow, AccountHeader } from '@components/common/Account';
import { Address } from '@components/common/Address';
import { TableCardBody } from '@components/common/TableCardBody';
import { Account, useAccountInfo, useFetchAccountInfo } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import React from 'react';
import ReactJson from 'react-json-view';
import {
    Attestation as SasAttestation,
    convertSasSchemaToBorshSchema,
    Credential as SasCredential,
    decodeAttestation,
    decodeCredential,
    decodeSchema,
    deserializeAttestationData,
    Schema as SasSchema,
} from 'sas-lib';
import { Address as TAddress, ReadonlyUint8Array } from 'web3js-experimental';

function decodeWithType(
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

function decodeAccount(account: Account) {
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

function SolanaCredentialCard({ credential }: { credential: SasCredential }) {
    return (
        <>
            <tr>
                <td>Credential Name</td>
                <td className="text-lg-end">{decodeString(credential.name)}</td>
            </tr>
            <tr>
                <td>Credential Authority</td>
                <td className="text-lg-end">
                    <Address pubkey={mapToPublicKey(credential.authority)} alignRight raw link />
                </td>
            </tr>
            <tr>
                <td>Authorized Signers</td>
                <td className="text-lg-end">
                    {credential.authorizedSigners.map((signer, idx) => (
                        <Address key={idx} pubkey={mapToPublicKey(signer)} alignRight raw link />
                    ))}
                </td>
            </tr>
        </>
    );
}

function decodeString(data: ReadonlyUint8Array) {
    return Buffer.from(data).toString('utf-8');
}

function mapToPublicKey(address: TAddress) {
    return new PublicKey(String(address));
}

function SolanaSchemaCard({ schema }: { schema: SasSchema }) {
    const borshSchema = convertSasSchemaToBorshSchema(schema);
    return (
        <>
            <tr>
                <td>Schema Name</td>
                <td className="text-lg-end">{decodeString(schema.name)}</td>
            </tr>
            <tr>
                <td>Credential</td>
                <td className="text-lg-end">
                    <Address pubkey={mapToPublicKey(schema.credential)} alignRight raw link />
                </td>
            </tr>
            <tr>
                <td>Description</td>
                <td className="text-lg-end">{decodeString(schema.description)}</td>
            </tr>
            <tr>
                <td>Is Paused</td>
                <td className="text-lg-end">{schema.isPaused ? 'Yes' : 'No'}</td>
            </tr>
            <tr>
                <td>Version</td>
                <td className="text-lg-end">{schema.version}</td>
            </tr>
            <tr>
                <td>Layout (Borsh)</td>
                <td className="text-lg-start">
                    <ReactJson src={borshSchema['schema']} theme={'solarized'} style={{ padding: 25 }} name={false} />
                </td>
            </tr>
        </>
    );
}

function SolanaAttestationCard({ attestation }: { attestation: SasAttestation }) {
    const schemaAccountInfo = useAccountInfo(mapToPublicKey(attestation.schema).toBase58());
    const fetchAccountInfo = useFetchAccountInfo();
    React.useEffect(() => {
        if (!schemaAccountInfo?.data) {
            fetchAccountInfo(mapToPublicKey(attestation.schema), 'parsed');
        }
    }, [schemaAccountInfo?.data, fetchAccountInfo, attestation.schema]);

    let decoded: any | null = null;
    try {
        if (schemaAccountInfo?.data) {
            const schema: SasSchema = decodeWithType(schemaAccountInfo.data, 'schema', decodeSchema)?.data.data;
            decoded = deserializeAttestationData(schema, Uint8Array.from(attestation.data));
        }
    } catch (e) {
        console.error(e);
    }

    return (
        <>
            <tr>
                <td>Nonce</td>
                <td className="text-lg-end">
                    <Address pubkey={mapToPublicKey(attestation.nonce)} alignRight raw link />
                </td>
            </tr>
            <tr>
                <td>Credential</td>
                <td className="text-lg-end">
                    <Address pubkey={mapToPublicKey(attestation.credential)} alignRight raw link />
                </td>
            </tr>

            <tr>
                <td>Schema</td>
                <td className="text-lg-end">
                    <Address pubkey={mapToPublicKey(attestation.schema)} alignRight raw link />
                </td>
            </tr>
            <tr>
                <td>Signer</td>
                <td className="text-lg-end">
                    <Address pubkey={mapToPublicKey(attestation.signer)} alignRight raw link />
                </td>
            </tr>
            <tr>
                <td>Token Account</td>
                <td className="text-lg-end">
                    <Address pubkey={mapToPublicKey(attestation.tokenAccount)} alignRight raw link />
                </td>
            </tr>
            <tr>
                <td>Expiry</td>
                <td className="text-lg-end">{Number(attestation.expiry)}</td>
            </tr>
            <tr>
                <td>Data (Base64)</td>
                {decoded ? (
                    <ReactJson src={decoded} theme={'solarized'} style={{ padding: 25 }} name={false} />
                ) : (
                    <td
                        className="text-lg-end"
                        style={{
                            fontSize: '0.85rem',
                            lineHeight: '1.2',
                            maxWidth: '100%',
                            overflowWrap: 'break-word',
                            whiteSpace: 'normal',
                            wordBreak: 'break-all',
                        }}
                    >
                        {Buffer.from(attestation.data).toString('base64')}
                    </td>
                )}
            </tr>
        </>
    );
}

export function SolanaAttestationServiceCard({ account }: { account: Account }) {
    const refresh = useFetchAccountInfo();

    const decoded = decodeAccount(account);
    let content = null;
    switch (decoded?.type) {
        case 'attestation':
            content = <SolanaAttestationCard attestation={decoded.data.data} />;
            break;
        case 'credential':
            content = <SolanaCredentialCard credential={decoded.data.data} />;
            break;
        case 'schema':
            content = <SolanaSchemaCard schema={decoded.data.data} />;
            break;
    }

    let title = 'Solana Attestation Service';
    if (decoded) {
        title = `${title} ${decoded.type.charAt(0).toUpperCase() + decoded.type.slice(1)}`;
    }

    return (
        <div className="card">
            <AccountHeader title={title} refresh={() => refresh(account.pubkey, 'parsed')} />
            <TableCardBody>
                <AccountAddressRow account={account} />
                {content}
            </TableCardBody>
        </div>
    );
}
