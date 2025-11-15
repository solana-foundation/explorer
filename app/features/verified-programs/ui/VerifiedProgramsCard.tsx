'use client';
import '../styles.css';

import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { TableCardBodyHeaded } from '@components/common/TableCardBody';
import { useDebounceCallback } from '@react-hook/debounce';
import { displayTimestampUtc } from '@utils/date';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import React, { useState } from 'react';

import { isValidGitHubUrl } from '../model';
import type { VerifiedProgramInfo } from '../types';
import { useVerifiedProgramsPagination } from '../useVerifiedProgramsPagination';

const SEARCH_DEBOUNCE_MS = 1000;

export function VerifiedProgramsCard() {
    const [searchQuery, setSearchQuery] = useState('');
    const handleSearchChange = useDebounceCallback((value: string) => setSearchQuery(value), SEARCH_DEBOUNCE_MS);

    const { programs, filteredPrograms, isLoading, isFetching, error, totalCount, foundLast, loadMore } =
        useVerifiedProgramsPagination(searchQuery);

    if (isLoading && programs.length === 0) {
        return <LoadingCard message="Loading verified programs..." />;
    }

    if (error && programs.length === 0) {
        return <ErrorCard text="Failed to load verified programs." />;
    }

    return (
        <div className="e-card">
            <div className="card-header e-space-x-20">
                <h3 className="card-header-title e-mb-0">Verified Programs</h3>
                <small>
                    {totalCount > 0 ? `${programs.length} of ${totalCount}` : programs.length} verified programs from{' '}
                    <a href="https://verify.osec.io" target="_blank" rel="noopener noreferrer">
                        osec.io
                    </a>
                </small>
            </div>

            <div className="e-card-body">
                <div className="e-mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search programs by name or address..."
                        onChange={e => handleSearchChange(e.target.value)}
                        aria-label="Search programs by name or address"
                    />
                </div>

                {filteredPrograms.length === 0 ? (
                    <div className="e-py-4 e-text-center">No programs match your search.</div>
                ) : (
                    <TableCardBodyHeaded
                        headerComponent={
                            <tr>
                                <th>Name</th>
                                <th>Address</th>
                                <th>Source Code</th>
                                <th>Last Verified</th>
                                <th className="e-text-end">Status</th>
                            </tr>
                        }
                    >
                        {filteredPrograms.map(program => (
                            <ProgramRow key={program.programId} program={program} />
                        ))}
                    </TableCardBodyHeaded>
                )}
            </div>

            {!foundLast && (
                <div className="card-footer">
                    <button
                        className="btn btn-primary w-100"
                        onClick={loadMore}
                        disabled={isFetching}
                        aria-label="Load more verified programs"
                    >
                        {isFetching ? (
                            <>
                                <span className="align-text-top spinner-grow spinner-grow-sm me-2"></span>
                                Loading
                            </>
                        ) : (
                            'Load More'
                        )}
                    </button>
                </div>
            )}

            {foundLast && programs.length > 0 && (
                <div className="card-footer">
                    <div className="text-muted text-center">All programs loaded</div>
                </div>
            )}
        </div>
    );
}

function CopyableAddress({ address }: { address: string }) {
    const addressPath = useClusterPath({ pathname: `/address/${address}` });

    return (
        <span className="font-monospace">
            <Link href={addressPath} className="text-decoration-none">
                {address}
            </Link>
        </span>
    );
}

function ProgramRow({ program }: { program: VerifiedProgramInfo }) {
    const showName = program.name !== program.programId;

    return (
        <tr>
            <td className="w-1">
                {showName ? (
                    <span className="font-monospace">{program.name}</span>
                ) : (
                    <span className="text-muted">—</span>
                )}
            </td>
            <td>
                <CopyableAddress address={program.programId} />
            </td>
            <td>
                {program.repoUrl && isValidGitHubUrl(program.repoUrl) ? (
                    <a
                        href={program.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-decoration-none"
                        aria-label={`View source code for ${program.name} on GitHub`}
                    >
                        GitHub →
                    </a>
                ) : (
                    <span className="text-muted">—</span>
                )}
            </td>
            <td>
                {program.lastVerifiedAt ? (
                    <span className="text-muted">
                        {displayTimestampUtc(new Date(program.lastVerifiedAt).getTime(), true)}
                    </span>
                ) : (
                    <span className="text-muted">—</span>
                )}
            </td>
            <td className="e-text-end">
                <span className="badge bg-success-soft">Verified</span>
            </td>
        </tr>
    );
}
