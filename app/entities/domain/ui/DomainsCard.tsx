'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import React from 'react';

import { useUserANSDomains } from '../model/use-user-ans-domains';
import { useUserSnsDomains } from '../model/use-user-sns-domains';
import { BaseDomainsCard } from './BaseDomainsCard';

// Fetches SNS and ANS domains in parallel because this card displays all domains.
// This differs from usePrimaryDomain which uses a waterfall (SNS first) to avoid
// the slower ANS fetch when only one domain name is needed.
export function DomainsCard({ address }: { address: string }) {
    const { data: domains, isLoading: domainsLoading, error: domainsError } = useUserSnsDomains(address);
    const { data: domainsANS, isLoading: domainsANSLoading, error: domainsANSError } = useUserANSDomains(address);

    if (domainsLoading || domainsANSLoading) {
        return <LoadingCard message="Loading domains" />;
    } else if (domainsError || domainsANSError) {
        return <ErrorCard text="Failed to fetch domains" />;
    }

    const allDomains = [...(domains ?? []), ...(domainsANS ?? [])];
    allDomains.sort((a, b) => a.name.localeCompare(b.name));

    if (allDomains.length === 0) {
        return <ErrorCard text="No domain name found" />;
    }

    return <BaseDomainsCard domains={allDomains} />;
}
