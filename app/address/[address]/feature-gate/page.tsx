import { FeatureGateCard } from '@components/account/FeatureGateCard';
import { FeatureGateMarkdown } from '@components/account/FeatureGateMarkdown';
import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import { getFeatureInfo } from '@/app/entities/feature-gate/server';
import { fetchFeatureGateInformation, getFeatureGateOpenGraph } from '@/app/features/feature-gate/server';

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    const title = `Feature Gate | ${await getReadableTitleFromAddress(props)} | Solana`;
    return {
        description: `Feature information for address ${address} on Solana`,
        openGraph: getFeatureGateOpenGraph(address),
        title,
    };
}

export default async function FeatureGatePage(props: Props) {
    const { address } = await props.params;

    const feature = getFeatureInfo(address);
    const [proposal] = await fetchFeatureGateInformation(feature);

    return (
        <FeatureGateCard>
            {proposal?.status === 'ok' ? (
                <FeatureGateMarkdown baseUrl={feature?.simd_link?.[0]}>{proposal.markdown}</FeatureGateMarkdown>
            ) : (
                <ProposalUnavailable url={proposal?.url ?? feature?.simd_link?.[0]} />
            )}
        </FeatureGateCard>
    );
}

function ProposalUnavailable({ url }: { url?: string }) {
    return (
        <p className="m-0 text-sm text-outer-space-300">
            Proposal text unavailable
            {url && (
                <>
                    {'. '}
                    <a
                        href={url}
                        className="text-dark-accent hover:text-dark-accent-hover"
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        View the proposal on GitHub
                    </a>
                </>
            )}
        </p>
    );
}
