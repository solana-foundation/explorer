import { redirect } from 'next/navigation';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

// Redirect to the new IDL page
export default function AnchorProgramIDLPage({ params: { address } }: Props) {
    redirect(`/address/${address}/idl`);
}
