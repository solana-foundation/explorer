import { AddressTabContent } from '@/app/address/[address]/AddressTabContent';

import StakeHistoryPageClient from './page-client';

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export const metadata = {
    description: `Stake history for each epoch on Solana`,
    title: `Stake History | Solana`,
};

export default async function StakeHistoryPage(props: Props) {
    const params = await props.params;
    return (
        <AddressTabContent>
            <StakeHistoryPageClient params={params} />
        </AddressTabContent>
    );
}
