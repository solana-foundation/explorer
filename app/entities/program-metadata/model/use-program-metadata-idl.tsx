'use client';

import { useProgramIdls } from '@entities/idl/@x/program-metadata';

import { Cluster } from '@/app/utils/cluster';

/**
 * The program's PMP IDL (`idl` seed), selected from the shared `useProgramIdls` resolution so the IDL
 * card, the transaction inspector, and this program-name label all read one cached result.
 * `useSuspense` lets the label suspend (it renders inside a Suspense boundary); other callers don't.
 */
export function useProgramMetadataIdl(programAddress: string, url: string, cluster: Cluster, useSuspense = false) {
    const { programMetadataIdl, isLoading } = useProgramIdls(programAddress, url, cluster, { suspense: useSuspense });
    return { isLoading, programMetadataIdl };
}
