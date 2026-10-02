'use client';

import { approveRpcOriginAtom, parseRpcEndpoint, useCluster } from '@entities/cluster';
import { useDebouncedCallback } from '@mantine/hooks';
import { scrollToTop } from '@shared/lib/scrollToTop';
import { Cluster } from '@utils/cluster';
import { useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { useClusterHref } from './use-cluster-href';

const COMMIT_DELAY_MS = 500;

export type CustomUrlDraft = {
    onChange: (next: string) => void;
    select: (next: string) => void;
    value: string;
};

export type CustomUrlDraftOptions = {
    commitOnType?: boolean;
};

export function useCustomUrlDraft({ commitOnType = true }: CustomUrlDraftOptions = {}): CustomUrlDraft {
    const { endpoint } = useCluster();
    const resolvedUrl = endpoint?.href ?? '';

    const buildHref = useClusterHref();
    const approveOrigin = useSetAtom(approveRpcOriginAtom);
    const router = useRouter();

    const [syncedUrl, setSyncedUrl] = useState(resolvedUrl);
    const [draftUrl, setDraftUrl] = useState(resolvedUrl);
    const [sentUrl, setSentUrl] = useState<string | undefined>(undefined);
    if (resolvedUrl !== syncedUrl) {
        setSyncedUrl(resolvedUrl);
        setSentUrl(undefined);
        if (resolvedUrl !== sentUrl) setDraftUrl(resolvedUrl);
    }

    const intended = useRef(resolvedUrl);

    const commitNow = (url: string, scroll: boolean) => {
        if (scroll) scrollToTop();
        if (url.trim() === '') {
            setSentUrl(undefined);
            router.replace(buildHref({ cluster: Cluster.Custom, customUrl: '' }), { scroll: false });
            return;
        }
        const typedEndpoint = parseRpcEndpoint(url);
        if (typedEndpoint === undefined) return;
        approveOrigin(typedEndpoint);
        setSentUrl(url);
        router.replace(buildHref({ cluster: Cluster.Custom, customUrl: url }), { scroll: false });
    };

    const commit = useDebouncedCallback((url: string) => {
        if (url !== intended.current) return;
        commitNow(url, false);
    }, COMMIT_DELAY_MS);

    return {
        onChange: (next: string) => {
            intended.current = next;
            setDraftUrl(next);
            if (commitOnType) commit(next);
        },
        select: (next: string) => {
            intended.current = next;
            setDraftUrl(next);
            commitNow(next, true);
        },
        value: draftUrl,
    };
}
