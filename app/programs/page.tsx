import ProgramsPageClient from './page-client';

export const metadata = {
    description: 'Browse verified Solana programs and check their verification status',
    title: 'Verified Programs | Solana Explorer',
};

export default function ProgramsPage() {
    return <ProgramsPageClient />;
}
