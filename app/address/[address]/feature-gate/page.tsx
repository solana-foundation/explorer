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
    const data = await fetchFeatureGateInformation(feature);

    return (
        <FeatureGateCard>
            <FeatureGateMarkdown baseUrl={feature?.simd_link?.[0]}>{data[0]}</FeatureGateMarkdown>
        </FeatureGateCard>
    );
}
