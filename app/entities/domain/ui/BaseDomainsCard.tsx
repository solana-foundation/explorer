'use client';

import { Address } from '@components/common/Address';
import { PublicKey } from '@solana/web3.js';
import React, { useMemo } from 'react';

import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

import { DomainInfo } from '../model/types';

export function BaseDomainsCard({ domains }: { domains: DomainInfo[] }) {
    const validDomains = useMemo(
        () =>
            domains
                .map(domain => ({ ...domain, pubkey: tryPublicKey(domain.address) }))
                .filter((d): d is DomainInfo & { pubkey: PublicKey } => d.pubkey !== null),
        [domains],
    );

    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    Owned Domain Names
                </CardTitle>
            </CardHeader>
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Head>
                    <BaseTable.Row>
                        <BaseTable.HeaderCell className="text-muted">Domain Name</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-muted">Name Service Account</BaseTable.HeaderCell>
                    </BaseTable.Row>
                </BaseTable.Head>
                <BaseTable.Body className="list">
                    {validDomains.map(domain => (
                        <BaseTable.Row key={domain.address}>
                            <BaseTable.Cell>{domain.name}</BaseTable.Cell>
                            <BaseTable.Cell>
                                <Address pubkey={domain.pubkey} link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    ))}
                </BaseTable.Body>
            </BaseTable>
        </Card>
    );
}

function tryPublicKey(address: string): PublicKey | null {
    try {
        return new PublicKey(address);
    } catch {
        return null;
    }
}
