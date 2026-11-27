import { AddressTabContent } from '@/app/address/[address]/AddressTabContent';

import RecentBlockhashesPageClient from './page-client';

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export const metadata = {
    description: `Recent blockhashes on Solana`,
    title: `Recent Blockhashes | Solana`,
};

export default async function RecentBlockhashesPage(props: Props) {
    const params = await props.params;
    return (
        <AddressTabContent>
            <RecentBlockhashesPageClient params={params} />
        </AddressTabContent>
    );
}
