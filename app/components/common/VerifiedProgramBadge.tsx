import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import { ExternalLink } from 'react-feather';

import { Badge } from '@/app/components/shared/ui/badge';
import { Skeleton } from '@/app/components/shared/ui/skeleton';
import { useCluster } from '@/app/providers/cluster';
import { supportsVerifiedBuilds, useIsProgramVerified } from '@/app/utils/verified-builds';
import { ProgramDataAccountInfo } from '@/app/validators/accounts/upgradeable-program';

const VERIFIED_BUILD_DOC_LINK = 'https://github.com/Ellipsis-Labs/solana-verifiable-build';

// Every value the Verified Build row can resolve to. The connected badge below maps the
// cluster + verified-build query onto one of these; the presentational badge renders it.
export type VerifiedBuildState = 'not-mainnet' | 'loading' | 'error' | 'verified' | 'not-verified';

/**
 * Presentational Verified Build badge — renders one state, no hooks. The whole value is a single
 * soft badge, on the tw `Badge`: `tone="soft"` reuses the same success/warning hues, and
 * `whitespace-normal` lets the label wrap in a narrow column.
 */
export function VerifiedBuildBadge({ state, size = 'xs' }: { state: VerifiedBuildState; size?: 'xs' | 'sm' }) {
    if (state === 'loading') {
        // Skeleton stands in for the value text; the row height is held by the label's line-box.
        return (
            <span className="min-w-0 break-words">
                <Skeleton
                    data-testid="verified-build-loading"
                    className="relative -top-0.5 inline-block h-3.5 w-40 align-middle"
                />
            </span>
        );
    }
    if (state === 'not-mainnet') {
        return (
            <Badge
                className="relative -top-0.5 justify-start whitespace-normal text-left"
                size={size}
                tone="soft"
                ui="tw"
                variant="warning"
            >
                Verified Builds only available on Mainnet and Devnet
            </Badge>
        );
    }
    if (state === 'error') {
        return (
            <Badge
                className="relative -top-0.5 justify-start whitespace-normal text-left"
                size={size}
                tone="soft"
                ui="tw"
                variant="warning"
            >
                Error fetching verified build information
            </Badge>
        );
    }

    // verified / not-verified: the whole badge links to the verified-build docs, with a trailing
    // external-link icon (the badge base sizes the svg + adds the gap).
    const variant = state === 'verified' ? 'success' : 'warning';
    const label = state === 'verified' ? 'Program Source Verified' : 'Program Not Verified';
    return (
        <Badge
            className="relative -top-0.5 cursor-pointer justify-start whitespace-normal text-left"
            size={size}
            tone="soft"
            ui="tw"
            variant={variant}
            asChild
        >
            <Link href={VERIFIED_BUILD_DOC_LINK} rel="noopener noreferrer" target="_blank">
                {label}
                <ExternalLink />
            </Link>
        </Badge>
    );
}

export function VerifiedProgramBadge({
    programData,
    pubkey,
}: {
    programData: ProgramDataAccountInfo;
    pubkey: PublicKey;
}) {
    const { cluster } = useCluster();
    const {
        isLoading,
        data: isVerified,
        error,
    } = useIsProgramVerified({
        programData,
        programId: pubkey,
    });

    let state: VerifiedBuildState;
    if (!supportsVerifiedBuilds(cluster)) {
        state = 'not-mainnet';
    } else if (isLoading) {
        state = 'loading';
    } else if (error) {
        state = 'error';
    } else {
        state = isVerified ? 'verified' : 'not-verified';
    }

    return <VerifiedBuildBadge state={state} />;
}
