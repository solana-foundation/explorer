'use client';

import { PublicKey } from '@solana/web3.js';
import React, { Fragment, useMemo } from 'react';

import { LoadingSpinner } from '@/app/components/common/LoadingCard';

import type { ProgramCallData } from '../model/types';
import { usePagination } from '../model/use-pagiantion';
import { useProgramCpiCalls } from '../model/use-program-cpi-calls';
import { CpiCallListItem } from './CpiCallListItem';

interface CpiCallsPageProps {
    address: string;
    limit: number;
    offset: number;
}

/**
 * Individual page component that fetches and renders its own data
 */
function CpiCallsPage({ address, limit, offset }: CpiCallsPageProps) {
    const pagination = usePagination();
    const { data, isLoading, error } = useProgramCpiCalls(
        { address, limit, offset },
        {
            onSuccess: data => {
                const total = data.pagination.totalPages * data.pagination.limit;
                if (!pagination.total || pagination.total !== total) {
                    pagination.setTotal(total);
                }
            },
        }
    );

    if (isLoading) {
        return (
            <>
                {Array.from({ length: 3 }).map((_, idx) => (
                    <tr key={`loading-${offset}-${idx}`}>
                        <td colSpan={3}>
                            <div className="skeleton-loader" style={{ height: '2rem' }}>
                                <LoadingSpinner />
                            </div>
                        </td>
                    </tr>
                ))}
            </>
        );
    }

    if (error) {
        return (
            <tr>
                <td colSpan={3} className="text-center text-muted">
                    Failed to load data: {error.message}
                </td>
            </tr>
        );
    }

    if (!data || data.length === 0) {
        return null;
    }

    return (
        <>
            {data.map(record => (
                <CpiCallListItem key={`${offset}-${record.address}`} record={populateRecordFromData(record)} />
            ))}
        </>
    );
}

/**
 * Renderer component that manages pagination state and renders multiple page components.
 * Each page component independently fetches its own data using useProgramCpiCalls hook.
 */
export function ProgramCpiCallsRenderer({ address }: { address: string }) {
    const { limit, offset } = usePagination();

    // Calculate which pages should be rendered based on current pagination state
    const pageConfigs = useMemo(() => {
        const configs = [];
        const currentMaxOffset = offset;

        // Render all pages up to the current offset
        for (let pageOffset = 0; pageOffset <= currentMaxOffset; pageOffset += limit) {
            configs.push({
                key: `page-${pageOffset}`,
                limit: limit,
                offset: pageOffset,
            });
        }
        return configs;
    }, [offset, limit]);

    return (
        <>
            {pageConfigs.map(config => (
                <Fragment key={config.key}>
                    <CpiCallsPage address={address} limit={config.limit} offset={config.offset} />
                </Fragment>
            ))}
        </>
    );
}

function populateRecordFromData({ address, calls_number, description, name }: ProgramCallData) {
    return {
        address: new PublicKey(address),
        calls: calls_number,
        description,
        name,
    };
}
