import { Button } from '@components/shared/ui/button';
import Link from 'next/link';

import type { FormattedExtendedReceipt } from '../types';
import { BaseReceipt, BlurredCircle } from './BaseReceipt';

interface ReceiptViewProps {
    data: FormattedExtendedReceipt;
    transactionPath: string;
    onViewTxClick: () => void;
}

export function ReceiptView({ data, transactionPath, onViewTxClick }: ReceiptViewProps) {
    return (
        <div className="container e-flex e-min-h-[90vh] e-flex-col e-items-center e-justify-center e-gap-6 e-px-5 e-py-10">
            <BlurredCircle />
            <BaseReceipt data={data} />
            <Button size="sm" className="e-me-2" asChild>
                <Link href={transactionPath} target="_blank" rel="noopener noreferrer" onClick={onViewTxClick}>
                    View transaction in Explorer
                </Link>
            </Button>
        </div>
    );
}
