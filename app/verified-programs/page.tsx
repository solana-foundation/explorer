import { Metadata } from 'next/types';

import { withSentryTraceData } from '@/app/utils/with-sentry-trace-data';

import ProgramsPageClient from './page-client';

export async function generateMetadata(): Promise<Metadata> {
    return withSentryTraceData({
        description: 'Browse verified Solana programs and check their verification status',
        title: 'Verified Programs | Solana Explorer',
    });
}

export default function ProgramsPage() {
    return <ProgramsPageClient />;
}
