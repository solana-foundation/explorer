'use client';

import { Address } from '@components/common/Address';
import { PublicKey } from '@solana/web3.js';
import React, { useMemo } from 'react';

import { CardHeader } from '@/app/shared/ui/Card';

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
        <div className="card">
            <CardHeader ui="dashkit">
                <h3 className="card-header-title">Owned Domain Names</h3>
            </CardHeader>
            {/* TODO: migrate to <BaseCardTable> from @/app/shared/ui/Table */}
            <div className="table-responsive e-mb-0">
                <table className="table table-sm table-nowrap card-table">
                    <thead>
                        <tr>
                            <th className="text-muted">Domain Name</th>
                            <th className="text-muted">Name Service Account</th>
                        </tr>
                    </thead>
                    <tbody className="list">
                        {validDomains.map(domain => (
                            <tr key={domain.address}>
                                <td>{domain.name}</td>
                                <td>
                                    <Address pubkey={domain.pubkey} link />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function tryPublicKey(address: string): PublicKey | null {
    try {
        return new PublicKey(address);
    } catch {
        return null;
    }
}
