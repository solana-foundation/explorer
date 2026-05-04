import SlotHashesPageClient from './page-client';

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export const metadata = {
    description: `Hashes of each slot on Solana`,
    title: `Slot Hashes | Solana`,
};

export default async function SlotHashesPage(props: Props) {
    const params = await props.params;
    return <SlotHashesPageClient params={params} />;
}
