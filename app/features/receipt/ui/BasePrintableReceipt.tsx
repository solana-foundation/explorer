import type { FormattedReceipt } from '../types';
import { Logo } from './Logo';

export interface LineItem {
    description: string;
    qty: string;
    total: string;
    unitPrice: string;
    vatPercent: string;
}

export interface BasePrintableReceiptProps {
    data: FormattedReceipt & {
        confirmationStatus?: string;
        signature: string;
    };
    lineItems: LineItem[];
    logoDataUrl?: string;
    onLineItemChange: (index: number, field: keyof LineItem, value: string) => void;
    subtotal: string;
    supplierAddress: string;
    supplierName: string;
    vatAmount: string;
    onSubtotalChange: (value: string) => void;
    onSupplierAddressChange: (value: string) => void;
    onSupplierNameChange: (value: string) => void;
    onVatAmountChange: (value: string) => void;
}

export function BasePrintableReceipt({
    data,
    lineItems,
    logoDataUrl,
    onLineItemChange,
    onSubtotalChange,
    onSupplierAddressChange,
    onSupplierNameChange,
    onVatAmountChange,
    subtotal,
    supplierAddress,
    supplierName,
    vatAmount,
}: BasePrintableReceiptProps) {
    const { date, fee, memo, network, receiver, sender, total } = data;
    const confirmationStatus = data.confirmationStatus ?? 'Unknown';
    const statusLabel = confirmationStatus.charAt(0).toUpperCase() + confirmationStatus.slice(1).toLowerCase();

    return (
        <div className="printable-receipt e-mx-auto e-max-w-3xl e-bg-white e-px-12 e-py-10 e-text-gray-900" id="printable-receipt">
            {logoDataUrl && (
                <div className="e-mb-6 e-flex e-justify-end">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoDataUrl} alt="Company logo" className="e-h-12 e-w-auto e-object-contain" />
                </div>
            )}

            <h1 className="e-m-0 e-text-2xl e-font-bold e-text-gray-900">Solana Payment Receipt</h1>
            <p className="e-m-0 e-mt-1 e-text-sm e-text-gray-400">On-chain Transaction Record</p>

            <hr className="e-my-6 e-border-gray-200" />

            <h2 className="e-m-0 e-text-base e-font-bold e-text-gray-900">Payment Details</h2>
            <div className="e-mt-4 e-grid e-grid-cols-[11rem_1fr] e-gap-y-2.5 e-text-sm">
                <span className="e-text-gray-500">Payment Method</span>
                <span>Solana Blockchain</span>

                <span className="e-text-gray-500">Payment Date</span>
                <span>{date.utc}</span>

                <span className="e-text-gray-500">Original Amount</span>
                <span className="e-font-mono">
                    {total.formatted} {total.unit}
                </span>

                <span className="e-text-gray-500">Network Fee</span>
                <span className="e-font-mono">{fee.formatted} SOL</span>

                <span className="e-text-gray-500">Network</span>
                <span>{network}</span>

                <span className="e-text-gray-500">Status</span>
                <span>{statusLabel}</span>

                <span className="e-text-gray-500">Sender Address</span>
                <span className="e-break-all e-font-mono e-text-xs">{sender.domain ?? sender.address}</span>

                <span className="e-text-gray-500">Receiver Address</span>
                <span className="e-break-all e-font-mono e-text-xs">{receiver.domain ?? receiver.address}</span>

                <span className="e-text-gray-500">Transaction Signature</span>
                <span className="e-break-all e-font-mono e-text-xs">{data.signature}</span>

                {memo && (
                    <>
                        <span className="e-text-gray-500">Memo</span>
                        <span>{memo}</span>
                    </>
                )}
            </div>

            <h2 className="e-m-0 e-mt-8 e-text-base e-font-bold e-text-gray-900">
                Supplier / Seller Information
            </h2>
            <div className="e-mt-4 e-grid e-grid-cols-[11rem_1fr] e-gap-y-2.5 e-text-sm">
                <span className="e-text-gray-500">Full Name</span>
                <EditableInput onChange={onSupplierNameChange} value={supplierName} />

                <span className="e-text-gray-500">Address</span>
                <EditableInput onChange={onSupplierAddressChange} value={supplierAddress} />
            </div>

            <h2 className="e-m-0 e-mt-8 e-text-base e-font-bold e-text-gray-900">Items / Services</h2>
            <table className="e-mt-4 e-w-full e-border-collapse e-text-sm">
                <thead>
                    <tr className="e-border-b e-border-gray-300">
                        <th className="e-pb-2 e-text-left e-font-semibold">Description</th>
                        <th className="e-w-16 e-pb-2 e-text-left e-font-semibold">Qty</th>
                        <th className="e-w-24 e-pb-2 e-text-left e-font-semibold">Unit Price</th>
                        <th className="e-w-20 e-pb-2 e-text-left e-font-semibold">VAT %</th>
                        <th className="e-w-24 e-pb-2 e-text-right e-font-semibold">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {lineItems.map((item, i) => (
                        <tr key={i}>
                            <td className="e-py-1 e-pr-2">
                                <EditableInput
                                    onChange={v => onLineItemChange(i, 'description', v)}
                                    value={item.description}
                                />
                            </td>
                            <td className="e-py-1 e-pr-2">
                                <EditableInput
                                    onChange={v => onLineItemChange(i, 'qty', v)}
                                    value={item.qty}
                                />
                            </td>
                            <td className="e-py-1 e-pr-2">
                                <EditableInput
                                    onChange={v => onLineItemChange(i, 'unitPrice', v)}
                                    value={item.unitPrice}
                                />
                            </td>
                            <td className="e-py-1 e-pr-2">
                                <EditableInput
                                    onChange={v => onLineItemChange(i, 'vatPercent', v)}
                                    value={item.vatPercent}
                                />
                            </td>
                            <td className="e-py-1">
                                <EditableInput
                                    className="e-text-right"
                                    onChange={v => onLineItemChange(i, 'total', v)}
                                    value={item.total}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="e-mt-4 e-flex e-flex-col e-items-end e-gap-1.5 e-text-sm">
                <div className="e-flex e-items-center e-gap-4">
                    <span className="e-text-gray-500">Subtotal</span>
                    <EditableInput className="e-w-28 e-text-right" onChange={onSubtotalChange} value={subtotal} />
                </div>
                <div className="e-flex e-items-center e-gap-4">
                    <span className="e-text-gray-500">VAT Amount</span>
                    <EditableInput className="e-w-28 e-text-right" onChange={onVatAmountChange} value={vatAmount} />
                </div>
                <div className="e-flex e-items-center e-gap-4">
                    <span className="e-font-bold">Total</span>
                    <div className="e-w-28 e-rounded e-border e-border-gray-300 e-bg-gray-50 e-px-2 e-py-1 e-text-right e-font-mono e-font-semibold">
                        {total.formatted} {total.unit}
                    </div>
                </div>
            </div>

            <p className="e-m-0 e-mt-10 e-text-[10px] e-leading-relaxed e-text-gray-400">
                This document is generated from on-chain Solana blockchain data. Editable fields (supplier info, items,
                VAT) are provided for the user to complete manually. On-chain data (addresses, amounts, dates) is
                pre-filled and verified against the blockchain. This receipt is not a tax invoice unless completed with
                appropriate details.
            </p>

            <div className="e-mt-8">
                <Logo style={{ color: '#000' }} />
            </div>
        </div>
    );
}

function EditableInput({
    className,
    onChange,
    value,
}: {
    className?: string;
    onChange: (value: string) => void;
    value: string;
}) {
    return (
        <input
            type="text"
            className={[
                'e-w-full e-rounded e-border e-border-gray-300 e-bg-gray-50 e-px-2 e-py-1 e-text-sm e-text-gray-900 e-outline-none',
                'focus:e-border-gray-400 focus:e-bg-white',
                'print:e-border-transparent print:e-bg-transparent',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
            onChange={e => onChange(e.target.value)}
            value={value}
        />
    );
}
