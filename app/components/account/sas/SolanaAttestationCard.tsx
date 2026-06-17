import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import { SystemProgram } from '@solana/web3.js';
import React from 'react';
import { Attestation as SasAttestation, Credential as SasCredential, Schema as SasSchema } from 'sas-lib';

import { AccountAddressRow } from '@/app/components/common/Account';
import { Address } from '@/app/components/common/Address';
import { Account } from '@/app/providers/accounts';
import { BaseTable } from '@/app/shared/ui/Table';
import { decodeAccount } from '@/app/utils/attestation-service';
import { decodeString, mapToPublicKey } from '@/app/utils/kit-wrapper';

function SolanaCredentialCard({ credential }: { credential: SasCredential }) {
    return (
        <>
            <BaseTable.Row>
                <BaseTable.Cell>Credential Name</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{decodeString(credential.name)}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Credential Authority</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={mapToPublicKey(credential.authority)} alignRight raw link />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Authorized Signers</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    {credential.authorizedSigners.map((signer, idx) => (
                        <Address key={idx} pubkey={mapToPublicKey(signer)} alignRight raw link />
                    ))}
                </BaseTable.Cell>
            </BaseTable.Row>
        </>
    );
}

function SolanaSchemaCard({ schema }: { schema: SasSchema }) {
    return (
        <>
            <BaseTable.Row>
                <BaseTable.Cell>Schema Name</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{decodeString(schema.name)}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Credential</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={mapToPublicKey(schema.credential)} alignRight raw link />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Description</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{decodeString(schema.description)}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Is Paused</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{schema.isPaused ? 'Yes' : 'No'}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Version</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{schema.version}</BaseTable.Cell>
            </BaseTable.Row>
        </>
    );
}

function SolanaAttestationCard({ attestation }: { attestation: SasAttestation }) {
    return (
        <>
            <BaseTable.Row>
                <BaseTable.Cell>Nonce</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={mapToPublicKey(attestation.nonce)} alignRight raw link />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Credential</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={mapToPublicKey(attestation.credential)} alignRight raw link />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Schema</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={mapToPublicKey(attestation.schema)} alignRight raw link />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Signer</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={mapToPublicKey(attestation.signer)} alignRight raw link />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Token Account</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    {attestation.tokenAccount.toString() === SystemProgram.programId.toBase58() ? (
                        'Not Initialized'
                    ) : (
                        <Address pubkey={mapToPublicKey(attestation.tokenAccount)} alignRight raw link />
                    )}
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Expiry</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{Number(attestation.expiry)}</BaseTable.Cell>
            </BaseTable.Row>
        </>
    );
}

export function SolanaAttestationServiceCard({ account }: { account: Account }) {
    const refresh = useRefreshAccount();

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
        <AccountCard
            title={title}
            account={account}
            analyticsSection="solana_attestation_service_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            {content}
        </AccountCard>
    );
}
