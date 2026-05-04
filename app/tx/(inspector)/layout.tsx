import '@/app/styles.css';

import { Metadata } from 'next/types';
import React from 'react';

export const metadata: Metadata = {
    description: 'Interactively inspect Solana transactions',
    title: 'Transaction Inspector | Solana',
};

export default function TransactionInspectorLayout({ children }: { children: React.ReactNode }) {
    return children;
}
