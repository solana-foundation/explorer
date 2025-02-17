import { FeatureGateCard } from '@components/account/FeatureGateCard';
import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';
import ReactMarkdown from 'react-markdown';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGFM from 'remark-gfm';

import { fetchFeatureGateInformation } from '@/app/features/feature-gate';
import { getFeatureInfo } from '@/app/utils/feature-gate/utils';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    return {
        description: `Feature information for address ${props.params.address} on Solana`,
        title: `Feature Gate | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

export default async function FeatureGatePage({ params: { address } }: Props) {
    const feature = getFeatureInfo(address);
    const data = await fetchFeatureGateInformation(feature);

    // remark-gfm won't handle github-flavoured-markdown with a table present at it
    // TODO: figure out a configuration to render GFM table correctly
    return (
        <FeatureGateCard>
            <ReactMarkdown remarkPlugins={[remarkGFM, remarkFrontmatter]}>{data}</ReactMarkdown>
        </FeatureGateCard>
    );
}
