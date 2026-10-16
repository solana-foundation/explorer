import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import { Attestation as SasAttestation, Credential as SasCredential, Schema as SasSchema } from '@solana/attestation';
import { SystemProgram } from '@solana/web3.js';
import React from 'react';

import { AccountAddressRow } from '@/app/components/common/Account';
import { Address } from '@/app/components/common/Address';
import { Account } from '@/app/providers/accounts';
import { type KeyValueRow, KeyValueRows, StackedList } from '@/app/shared/ui/key-value';
import { decodeAccount } from '@/app/utils/attestation-service';
import { decodeString, mapToPublicKey } from '@/app/utils/kit-wrapper';

function SolanaCredentialCard({ credential }: { credential: SasCredential }) {
    const rows: KeyValueRow[] = [
        { label: 'Credential Name', value: decodeString(credential.name) },
        { label: 'Credential Authority', value: <Address pubkey={mapToPublicKey(credential.authority)} raw link /> },
        {
            label: 'Authorized Signers',
            value: (
                <StackedList>
                    {credential.authorizedSigners.map((signer, idx) => (
                        <li key={idx}>
                            <Address pubkey={mapToPublicKey(signer)} raw link />
                        </li>
                    ))}
                </StackedList>
            ),
        },
    ];

    return <KeyValueRows rows={rows} />;
}

function SolanaSchemaCard({ schema }: { schema: SasSchema }) {
    const rows: KeyValueRow[] = [
        { label: 'Schema Name', value: schema.name },
        { label: 'Credential', value: <Address pubkey={mapToPublicKey(schema.credential)} raw link /> },
        { label: 'Description', value: schema.description },
        { label: 'Is Paused', value: schema.isPaused ? 'Yes' : 'No' },
        { label: 'Version', value: schema.version },
    ];

    return <KeyValueRows rows={rows} />;
}

function SolanaAttestationCard({ attestation }: { attestation: SasAttestation }) {
    const rows: KeyValueRow[] = [
        { label: 'Nonce', value: <Address pubkey={mapToPublicKey(attestation.nonce)} raw link /> },
        { label: 'Credential', value: <Address pubkey={mapToPublicKey(attestation.credential)} raw link /> },
        { label: 'Schema', value: <Address pubkey={mapToPublicKey(attestation.schema)} raw link /> },
        { label: 'Signer', value: <Address pubkey={mapToPublicKey(attestation.signer)} raw link /> },
        {
            label: 'Token Account',
            value:
                attestation.tokenAccount.toString() === SystemProgram.programId.toBase58() ? (
                    'Not Initialized'
                ) : (
                    <Address pubkey={mapToPublicKey(attestation.tokenAccount)} raw link />
                ),
        },
        { label: 'Expiry', value: Number(attestation.expiry) },
    ];

    return <KeyValueRows rows={rows} />;
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
