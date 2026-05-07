import { Logo } from '@/app/shared/components/SolanaLogo';

import type { FormattedReceipt } from '../types';
import { BottomLine } from './BottomLine';

export const IMAGE_SIZE = {
    height: 630,
    width: 1200,
};

type BaseReceiptImageProps = {
    data: FormattedReceipt | undefined;
    options?: {
        size?: {
            height: number;
            width: number;
        };
    };
};

const MAX_VISIBLE_TRANSFERS = 2;

export function BaseReceiptImage({ data, options }: BaseReceiptImageProps) {
    const size = options?.size || IMAGE_SIZE;

    if (!data) return <NoReceipt size={size} />;

    const { date, fee, memo, receiver, sender, total, transfers } = data;
    const truncatedMemo = memo ? (memo.length > 90 ? `${memo.substring(0, 90)}...` : memo) : undefined;

    const transferList = transfers ?? [{ amount: total, receiver, sender }];
    const visibleTransfers = transferList.slice(0, MAX_VISIBLE_TRANSFERS);
    const hiddenCount = Math.max(0, transferList.length - MAX_VISIBLE_TRANSFERS);

    return (
        <div
            style={{
                backgroundImage: `radial-gradient(ellipse at 50% 50%, ${colors.emerald700} 0%, #EBEBEB 90%)`,
                display: 'flex',
                height: '100%',
                padding: '0 76px 12px',
                width: '100%',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                {/* Card */}
                <div
                    style={{
                        backgroundColor: colors.neutral100,
                        display: 'flex',
                        flexDirection: 'column',
                        flexGrow: 1,
                        gap: '24px',
                        overflow: 'hidden',
                        padding: '24px 54px 28px',
                    }}
                >
                    {/* Header: logo + "Receipt" on left, date on right */}
                    <div
                        style={{
                            alignItems: 'center',
                            display: 'flex',
                            justifyContent: 'space-between',
                            width: '100%',
                        }}
                    >
                        <div style={{ alignItems: 'center', display: 'flex', gap: '17px' }}>
                            <Logo style={{ color: colors.heavyMetal800, height: '26px', width: '229px' }} />
                            <span style={{ ...headerTextStyle, color: colors.neutral800 }}>Receipt</span>
                        </div>
                        <span style={{ ...headerTextStyle, color: colors.neutral500 }}>{date.utc}</span>
                    </div>

                    {/* Transfer table */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        {/* Column headers */}
                        <div
                            style={{
                                borderBottom: `2px dashed ${colors.heavyMetal200}`,
                                display: 'flex',
                                gap: '12px',
                                padding: '8px 0',
                                width: '100%',
                            }}
                        >
                            <span style={columnLabelStyle}>Sender</span>
                            <span style={columnLabelStyle}>Receiver</span>
                            <div style={{ display: 'flex', flex: 1, justifyContent: 'flex-end' }}>
                                <span
                                    style={{
                                        color: columnLabelStyle.color,
                                        fontSize: columnLabelStyle.fontSize,
                                        letterSpacing: columnLabelStyle.letterSpacing,
                                        lineHeight: columnLabelStyle.lineHeight,
                                    }}
                                >
                                    Amount
                                </span>
                            </div>
                        </div>

                        {/* Transfer rows */}
                        {visibleTransfers.map((transfer, i) => (
                            <div key={i} style={{ ...tableDataRowStyle, gap: '12px' }}>
                                <span style={addressStyle}>{transfer.sender.truncated}</span>
                                <span style={addressStyle}>{transfer.receiver.truncated}</span>
                                <div style={amountCellStyle}>
                                    <AmountDisplay amount={transfer.amount.formatted} unit={transfer.amount.unit} />
                                </div>
                            </div>
                        ))}

                        {/* "N more" row */}
                        {hiddenCount > 0 && (
                            <div style={tableDataRowStyle}>
                                <div style={amountCellStyle}>
                                    <span
                                        style={{
                                            color: colors.neutral500,
                                            fontSize: '44px',
                                            letterSpacing: '-0.88px',
                                            lineHeight: '50px',
                                        }}
                                    >
                                        and {hiddenCount} more
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Fee row */}
                        <div style={{ ...tableDataRowStyle, gap: '12px' }}>
                            <span style={{ ...columnLabelStyle }}>Fee</span>
                            <div style={{ width: '260px' }} />
                            <div style={amountCellStyle}>
                                <AmountDisplay amount={fee.formatted} unit="SOL" />
                            </div>
                        </div>
                    </div>

                    {/* Memo */}
                    {truncatedMemo && (
                        <div style={{ alignItems: 'center', display: 'flex', gap: '125px', width: '100%' }}>
                            <span
                                style={{
                                    color: colors.neutral500,
                                    flexShrink: 0,
                                    fontSize: '36px',
                                    letterSpacing: '-0.72px',
                                }}
                            >
                                Memo
                            </span>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <span
                                    style={{
                                        color: colors.neutral950,
                                        display: 'block',
                                        fontSize: '34px',
                                        letterSpacing: '-0.68px',
                                        overflow: 'hidden',
                                        textAlign: 'right',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {truncatedMemo}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Receipt saw edge */}
                <BottomLine style={{ color: colors.neutral100 }} />
            </div>
        </div>
    );
}

function AmountDisplay({ amount, unit }: { amount: string; unit: string }) {
    const { bright, dim } = splitAmount(amount);
    return (
        <span style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
            <span style={{ display: 'flex' }}>
                {dim && <span style={{ ...amountTextStyle, color: colors.neutral500 }}>{dim}</span>}
                <span style={{ ...amountTextStyle, color: colors.neutral950 }}>{bright}</span>
            </span>
            <span style={{ ...amountTextStyle, color: colors.neutral500 }}>{unit}</span>
        </span>
    );
}

function splitAmount(formatted: string): { bright: string; dim: string } {
    // Split "0.000123" into dim="0.00" + bright="123". Non-zero integer parts are unsplit.
    // eslint-disable-next-line no-restricted-syntax -- way to separate the leading zero fraction from the first significant digit
    const match = formatted.match(/^(0\.0*)([1-9].*)/);
    if (!match) return { bright: formatted, dim: '' };
    return { bright: match[2], dim: match[1] };
}

function NoReceipt({ size }: { size: { width: number; height: number } }) {
    return (
        <div
            style={{
                backgroundColor: colors.outerSpace900,
                color: colors.white,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                height: size.height,
                width: size.width,
            }}
        >
            <div
                style={{
                    alignItems: 'flex-end',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    padding: '23px 37px',
                    width: '100%',
                }}
            >
                <Logo style={{ color: colors.white, height: '26px', width: '229px' }} />
            </div>

            <div
                style={{
                    alignItems: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    fontSize: '51px',
                    gap: '24px',
                    justifyContent: 'center',
                    margin: '0 auto',
                    maxWidth: '70%',
                    textAlign: 'center',
                }}
            >
                See the transaction details on the Solana Explorer.
            </div>
        </div>
    );
}

const colors = {
    emerald700: '#0ea476',
    heavyMetal200: '#9faea7',
    heavyMetal800: '#29302c',
    neutral100: '#f5f5f5',
    neutral500: '#737373',
    neutral800: '#262626',
    neutral950: '#0a0a0a',
    outerSpace900: '#1d2322',
    white: '#fff',
};

const headerTextStyle = {
    fontSize: '36px',
    letterSpacing: '-0.72px',
    lineHeight: '37.7px',
} as const;

const columnLabelStyle = {
    color: colors.neutral500,
    fontSize: '36px',
    letterSpacing: '-0.72px',
    lineHeight: '40px',
    width: '260px',
} as const;

const addressStyle = {
    color: colors.emerald700,
    fontSize: '36px',
    letterSpacing: '-0.72px',
    lineHeight: '40px',
    width: '260px',
} as const;

const tableDataRowStyle = {
    borderBottom: `2px dashed ${colors.heavyMetal200}`,
    display: 'flex',
    height: '66px',
    padding: '8px 0',
    width: '100%',
} as const;

const amountCellStyle = {
    alignItems: 'flex-start',
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-end',
} as const;

const amountTextStyle = {
    fontSize: '44px',
    lineHeight: '50px',
} as const;
