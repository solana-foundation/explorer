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

    return (
        <FeatureGateCard>
            <ReactMarkdown
                remarkPlugins={[remarkGFM, remarkFrontmatter]}
                components={{
                    h2: ({ children }) => <h2 className="e-mb-2 e-mt-5 e-text-gray-300">{children}</h2>,
                    li: ({ children }) => <li className="e-mb-1 e-text-gray-400">{children}</li>,
                    p: ({ children }) => <p className="e-mb-4 e-mt-0 e-text-gray-400">{children}</p>,
                    table: ({ children }) => <table className="table table-sm">{children}</table>,
                }}
            >
                {data[0]}
            </ReactMarkdown>
        </FeatureGateCard>
    );
}
