import SupplyPageClient from './page-client';

export const metadata = {
    description: `Overview of the native token supply on Fogo`,
    title: `Supply Overview | Fogo`,
};

export default function SupplyPage() {
    return <SupplyPageClient />;
}
