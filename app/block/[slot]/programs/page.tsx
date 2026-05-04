import { Metadata } from 'next/types';

import BlockProgramsTabClient from './page-client';

type Props = Readonly<{
    params: Promise<{
        slot: string;
    }>;
}>;

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { slot } = await props.params;

    return {
        description: `Statistics pertaining to programs which were active during block ${slot} on Solana`,
        title: `Programs Active In Block | ${slot} | Solana`,
    };
}

export default async function BlockProgramsTab(props: Props) {
    const params = await props.params;
    return <BlockProgramsTabClient params={params} />;
}
