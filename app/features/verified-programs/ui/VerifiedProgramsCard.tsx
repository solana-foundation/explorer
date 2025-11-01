'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { TableCardBodyHeaded } from '@components/common/TableCardBody';
import { useDebounceCallback } from '@react-hook/debounce';
import { displayTimestampUtc } from '@utils/date';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';

import {
    fetchProgramsProgressively,
    isValidGitHubUrl,
    type VerifiedProgramInfo,
} from '@/app/features/verified-programs';

const SEARCH_DEBOUNCE_MS = 1000;

export function VerifiedProgramsCard() {
    const [searchQuery, setSearchQuery] = useState('');
    const [programs, setPrograms] = useState<VerifiedProgramInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [loadedCount, setLoadedCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const handleSearchChange = useDebounceCallback((value: string) => setSearchQuery(value), SEARCH_DEBOUNCE_MS);

    useEffect(() => {
        let cancelled = false;

        async function loadPrograms() {
            try {
                await fetchProgramsProgressively((pagePrograms, page, pages, total) => {
                    if (cancelled) return;

                    setPrograms(prev => [...prev, ...pagePrograms]);
                    setLoadedCount(prev => prev + pagePrograms.length);
                    setCurrentPage(page);
                    setTotalPages(pages);
                    setTotalCount(total);

                    if (page === pages) {
                        setIsLoading(false);
                    }
                });
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err : new Error('Failed to load programs'));
                    setIsLoading(false);
                }
            }
        }

        loadPrograms();

        return () => {
            cancelled = true;
        };
    }, []);

    const isLoadingMore = isLoading && programs.length > 0;

    const filteredPrograms = useMemo(() => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return programs.filter(
                p => p.name.toLowerCase().includes(query) || p.programId.toLowerCase().includes(query)
            );
        }

        return programs;
    }, [programs, searchQuery]);

    if (isLoading && programs.length === 0) {
        return <LoadingCard message="Loading verified programs..." />;
    }

    if (error && programs.length === 0) {
        return <ErrorCard text="Failed to load verified programs." />;
    }

    return (
        <div className="e-card">
            <div className="card-header">
                <h3 className="card-header-title mb-0">Verified Programs</h3>
                <small>
                    {isLoading && totalCount > 0
                        ? `${programs.length} of ${totalCount}`
                        : totalCount > 0
                        ? totalCount
                        : programs.length}{' '}
                    verified programs from{' '}
                    <a href="https://verify.osec.io" target="_blank" rel="noopener noreferrer">
                        osec.io
                    </a>
                </small>
            </div>

            <div className="e-card-body">
                {isLoadingMore && (
                    <div className="alert alert-info mb-3" role="status" aria-live="polite">
                        <div className="d-flex align-items-center">
                            <div className="spinner-border spinner-border-sm me-2" role="status">
                                <span className="visually-hidden">Loading</span>
                            </div>
                            <small>
                                Loading programs... ({loadedCount}/{totalCount} loaded - Page {currentPage}/{totalPages}
                                )
                            </small>
                        </div>
                    </div>
                )}

                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search programs by name or address..."
                        onChange={e => handleSearchChange(e.target.value)}
                        aria-label="Search programs by name or address"
                    />
                </div>

                {filteredPrograms.length === 0 ? (
                    <div className="text-center py-4">No programs match your search.</div>
                ) : (
                    <TableCardBodyHeaded
                        headerComponent={
                            <tr>
                                <th>Name</th>
                                <th>Address</th>
                                <th>Source Code</th>
                                <th>Last Verified</th>
                                <th className="text-end">Status</th>
                            </tr>
                        }
                    >
                        {filteredPrograms.map(program => (
                            <ProgramRow key={program.programId} program={program} />
                        ))}
                    </TableCardBodyHeaded>
                )}
            </div>
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
    // Hide name if it matches the address
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
            <td className="text-end">
                <span className="badge bg-success-soft">Verified</span>
            </td>
        </tr>
    );
}
