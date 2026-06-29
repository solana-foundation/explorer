import { FeatureGateCard } from '@components/account/FeatureGateCard';
import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';
import ReactMarkdown from 'react-markdown';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGFM from 'remark-gfm';

import { getFeatureInfo } from '@/app/entities/feature-gate/server';
import { fetchFeatureGateInformation, getFeatureGateOpenGraph } from '@/app/features/feature-gate/server';
import { BaseTable } from '@/app/shared/ui/Table';

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
            <ReactMarkdown
                remarkPlugins={[remarkGFM, remarkFrontmatter]}
                components={{
                    h2: ({ children }) => <h2 className="mb-2 mt-5 text-gray-300">{children}</h2>,
                    li: ({ children }) => <li className="mb-1 text-gray-400">{children}</li>,
                    p: ({ children }) => <p className="mb-4 mt-0 text-gray-400">{children}</p>,
                    table: ({ children }) => <BaseTable ui="dashkit">{children}</BaseTable>,
                }}
            >
                {data[0]}
            </ReactMarkdown>
        </FeatureGateCard>
    );
}
