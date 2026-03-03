'use client';

import { useCallback, useRef, useState } from 'react';
import { ArrowLeft, Image as ImageIcon, Printer } from 'react-feather';

import type { FormattedReceipt } from '../types';
import { BasePrintableReceipt, type LineItem } from './BasePrintableReceipt';

interface PrintableReceiptViewProps {
    data: FormattedReceipt & {
        confirmationStatus?: string;
        signature: string;
    };
    onBack: () => void;
}

const EMPTY_LINE_ITEM: LineItem = { description: '', qty: '', total: '', unitPrice: '', vatPercent: '' };
const INITIAL_LINE_ITEMS: LineItem[] = Array.from({ length: 4 }, () => ({ ...EMPTY_LINE_ITEM }));

export function PrintableReceiptView({ data, onBack }: PrintableReceiptViewProps) {
    const [supplierName, setSupplierName] = useState('');
    const [supplierAddress, setSupplierAddress] = useState('');
    const [subtotal, setSubtotal] = useState('');
    const [vatAmount, setVatAmount] = useState('');
    const [lineItems, setLineItems] = useState<LineItem[]>(INITIAL_LINE_ITEMS);
    const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setLogoDataUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    }, []);

    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    const handleLineItemChange = useCallback((index: number, field: keyof LineItem, value: string) => {
        setLineItems(prev => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    }, []);

    return (
        <div className="e-min-h-screen e-bg-gray-100">
            <div className="print:e-hidden e-flex e-items-center e-justify-between e-border-b e-border-gray-200 e-bg-white e-px-6 e-py-3">
                <button
                    type="button"
                    className="e-flex e-items-center e-gap-1.5 e-border-0 e-bg-transparent e-text-sm e-text-gray-600 hover:e-text-gray-900"
                    onClick={onBack}
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                <div className="e-flex e-items-center e-gap-3">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="e-hidden"
                        onChange={handleLogoUpload}
                    />
                    <button
                        type="button"
                        className="e-flex e-items-center e-gap-1.5 e-rounded e-border e-border-gray-300 e-bg-white e-px-3 e-py-1.5 e-text-sm e-text-gray-700 hover:e-bg-gray-50"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImageIcon size={14} />
                        {logoDataUrl ? 'Change Logo' : 'Add Logo'}
                    </button>
                    <button
                        type="button"
                        className="e-flex e-items-center e-gap-1.5 e-rounded e-bg-gray-900 e-px-3 e-py-1.5 e-text-sm e-text-white hover:e-bg-gray-800"
                        onClick={handlePrint}
                    >
                        <Printer size={14} />
                        Print
                    </button>
                </div>
            </div>

            <div className="e-py-8">
                <BasePrintableReceipt
                    data={data}
                    lineItems={lineItems}
                    logoDataUrl={logoDataUrl}
                    onLineItemChange={handleLineItemChange}
                    onSubtotalChange={setSubtotal}
                    onSupplierAddressChange={setSupplierAddress}
                    onSupplierNameChange={setSupplierName}
                    onVatAmountChange={setVatAmount}
                    subtotal={subtotal}
                    supplierAddress={supplierAddress}
                    supplierName={supplierName}
                    vatAmount={vatAmount}
                />
            </div>
        </div>
    );
}
