import { LoadingCard } from '@components/common/LoadingCard';

import { AddressTabContent } from '@/app/address/[address]/AddressTabContent';

export default function AddressTabLoading() {
    return (
        <AddressTabContent>
            <LoadingCard />
        </AddressTabContent>
    );
}
