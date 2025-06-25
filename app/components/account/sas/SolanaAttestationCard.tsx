import { SystemProgram } from '@solana/web3.js';
import React from 'react';
import { Attestation as SasAttestation, Credential as SasCredential, Schema as SasSchema } from 'sas-lib';

import { AccountAddressRow, AccountHeader } from '@/app/components/common/Account';
import { Address } from '@/app/components/common/Address';
import { TableCardBody } from '@/app/components/common/TableCardBody';
import { Account, useFetchAccountInfo } from '@/app/providers/accounts';
import { decodeAccount } from '@/app/utils/attestation-service';
import { decodeString, mapToPublicKey } from '@/app/utils/kit-wrapper';

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

function SolanaSchemaCard({ schema }: { schema: SasSchema }) {
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
        </>
    );
}

function SolanaAttestationCard({ attestation }: { attestation: SasAttestation }) {
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
                    {attestation.tokenAccount.toString() === SystemProgram.programId.toBase58() ? (
                        'Not Initialized'
                    ) : (
                        <Address pubkey={mapToPublicKey(attestation.tokenAccount)} alignRight raw link />
                    )}
                </td>
            </tr>
            <tr>
                <td>Expiry</td>
                <td className="text-lg-end">{Number(attestation.expiry)}</td>
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
        title = `${title}: ${decoded.type.charAt(0).toUpperCase() + decoded.type.slice(1)}`;
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
