'use client';

import '../features/verified-programs/styles.css';

import { VerifiedProgramsCard } from '@/app/features/verified-programs';

export default function ProgramsPageClient() {
    return (
        <div className="container e-mt-4">
            <VerifiedProgramsCard />
        </div>
    );
}
