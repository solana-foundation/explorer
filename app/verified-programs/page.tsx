import { Metadata } from 'next/types';

import { withTraceData } from '@/app/shared/lib/sentry';

import ProgramsPageClient from './page-client';

export async function generateMetadata(): Promise<Metadata> {
    return withTraceData({
        description: 'Browse verified Solana programs and check their verification status',
        title: 'Verified Programs | Solana Explorer',
    });
}

export default function ProgramsPage() {
    return <ProgramsPageClient />;
}
