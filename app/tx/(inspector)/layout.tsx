import { Metadata } from 'next/types';
import React from 'react';

type Props = Readonly<{
    children: React.ReactNode;
    params: Readonly<{
        signature: string;
    }>;
}>;

export async function generateMetadata({ params: { signature } }: Props): Promise<Metadata> {
    if (signature) {
        return {
            description: `Interactively inspect the Fogo transaction with signature ${signature}`,
            title: `Transaction Inspector | ${signature} | Fogo`,
        };
    } else {
        return {
            description: `Interactively inspect Fogo transactions`,
            title: `Transaction Inspector | Fogo`,
        };
    }
}

export default function TransactionInspectorLayout({ children }: Props) {
    return children;
}
