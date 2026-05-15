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
    const isMulti = transfers && transfers.length > 1;

    if (isMulti) {
        const visibleTransfers = transfers.slice(0, MAX_VISIBLE_TRANSFERS);
        const hiddenCount = Math.max(0, transfers.length - MAX_VISIBLE_TRANSFERS);

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
                            gap: SPACING.cardGap,
                            minHeight: SPACING.cardMinHeight,
                            overflow: 'hidden',
                            padding: SPACING.cardPadding,
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
                                    gap: SPACING.rowGap,
                                    padding: SPACING.rowPadding,
                                    width: '100%',
                                }}
                            >
                                <span style={columnLabelStyle}>Sender</span>
                                <span style={columnLabelStyle}>Receiver</span>
                                <div style={{ display: 'flex', flex: 1, justifyContent: 'flex-end' }}>
                                    <span style={{ ...columnLabelStyle, width: 'auto' }}>Amount</span>
                                </div>
                            </div>

                            {/* Transfer rows */}
                            {visibleTransfers.map((transfer, i) => (
                                <div
                                    key={`${transfer.sender.address}-${i}`}
                                    style={{ ...tableDataRowStyle, gap: SPACING.rowGap }}
                                >
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
                                        <span style={{ color: colors.neutral500, ...TYPO.body }}>
                                            and {hiddenCount} more
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Fee row */}
                            <div style={{ ...tableDataRowStyle, gap: SPACING.rowGap }}>
                                <span style={{ ...columnLabelStyle }}>Fee</span>
                                <div style={{ width: SPACING.columnWidth }} />
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
                                        fontSize: TYPO.body.fontSize,
                                        letterSpacing: TYPO.body.letterSpacing,
                                    }}
                                >
                                    Memo
                                </span>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <span
                                        style={{
                                            color: colors.neutral950,
                                            display: 'block',
                                            ...TYPO.memo,
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

    return (
        <div
            style={{
                backgroundImage: `radial-gradient(ellipse at 50% 50%, ${colors.emerald700} 0%, #EBEBEB 90%)`,
                display: 'flex',
                height: '100%',
                justifyContent: 'center',
                padding: '0 75px 40px',
                width: '100%',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    padding: '0',
                    position: 'relative',
                    width: '100%',
                }}
            >
                <div
                    style={{
                        background: colors.white,
                        borderBottom: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        flexGrow: 1,
                    }}
                >
                    <Header />
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            flexGrow: 1,
                        }}
                    >
                        <ListItem label="Sender" value={sender.truncated} />
                        <ListItem label="Date" value={date.utc} valueColor={colors.emerald900} />
                        <ListItem
                            label="1. Sent"
                            style={{ flexGrow: 1 }}
                            value={
                                <div
                                    style={{
                                        alignItems: 'center',
                                        display: 'flex',
                                        flexGrow: 1,
                                        fontSize: '36px',
                                        gap: '8px',
                                        lineHeight: '1em',
                                    }}
                                >
                                    <span style={{ color: colors.heavyMetal800, fontWeight: 600, lineHeight: '1em' }}>
                                        {total.formatted} {total.unit}
                                    </span>
                                    <span style={{ color: colors.neutral500, lineHeight: '1em' }}>to</span>
                                    <span style={{ color: colors.emerald700 }}>{receiver.truncated}</span>
                                </div>
                            }
                        />
                        {truncatedMemo && (
                            <ListItem
                                label="Memo"
                                value={
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexGrow: 1,
                                            fontSize: '34px',
                                            gap: '8px',
                                            lineHeight: '1em',
                                            textAlign: 'right',
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: colors.heavyMetal800,
                                                marginLeft: 'auto',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                width: '714px',
                                            }}
                                        >
                                            {truncatedMemo}
                                        </span>
                                    </div>
                                }
                                valueColor={colors.emerald900}
                            />
                        )}
                    </div>

                    <Footer fee={fee.formatted} />
                </div>

                <BottomLine style={{ color: colors.white }} />
            </div>
        </div>
    );
}

function Header() {
    return (
        <div
            style={{
                alignItems: 'center',
                borderBottom: `2px solid ${colors.neutral200}`,
                display: 'flex',
                justifyContent: 'space-between',
                padding: '20px 54px',
            }}
        >
            <div style={{ alignItems: 'center', display: 'flex', gap: '12px' }}>
                <Logo style={{ color: colors.heavyMetal800, height: '26px', width: '229px' }} />
                <span style={{ color: colors.heavyMetal800, fontSize: '35px', fontWeight: 500 }}>Receipt</span>
            </div>
        </div>
    );
}

function Footer({ fee }: { fee: string }) {
    return (
        <div
            style={{
                borderTop: '2px dashed rgba(255, 255, 255, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                padding: '29px 54px 16px',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.neutral500, fontSize: '36px', lineHeight: '1em' }}>Fee</span>
                <span style={{ color: colors.emerald900, fontSize: '34px', lineHeight: '1em' }}>{fee} SOL</span>
            </div>
        </div>
    );
}

function ListItem({
    label,
    value,
    valueColor = colors.emerald700,
    style,
}: {
    label: string;
    value: React.ReactNode | string | undefined;
    valueColor?: string;
    style?: React.CSSProperties;
}) {
    if (!value) return null;
    return (
        <div
            style={{
                alignItems: 'flex-start',
                borderBottom: `2px dashed ${colors.neutral200}`,
                display: 'flex',
                gap: '16px',
                justifyContent: 'space-between',
                padding: '22px 54px',

                ...style,
            }}
        >
            <Description text={label} />
            {typeof value === 'string' ? (
                <span
                    style={{
                        color: valueColor,
                        display: 'flex',
                        flex: 1,
                        fontSize: '34px',
                        justifyContent: 'flex-end',
                    }}
                >
                    {value}
                </span>
            ) : (
                value
            )}
        </div>
    );
}

function Description({ text }: { text: string }) {
    return <span style={{ color: colors.neutral500, fontSize: '36px', lineHeight: '1em' }}>{text}</span>;
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

// Split "0.000123" into dim="0.00" + bright="123". Non-zero integer parts are unsplit.
// eslint-disable-next-line no-restricted-syntax -- way to separate the leading zero fraction from the first significant digit
const AMOUNT_SPLIT_RE = /^(0\.0*)([1-9].*)/;

function splitAmount(formatted: string): { bright: string; dim: string } {
    const match = formatted.match(AMOUNT_SPLIT_RE);
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
    emerald900: '#053D2C',
    heavyMetal200: '#9faea7',
    heavyMetal800: '#29302c',
    neutral100: '#f5f5f5',
    neutral200: '#e5e5e5',
    neutral500: '#737373',
    neutral800: '#262626',
    neutral950: '#0a0a0a',
    outerSpace900: '#1d2322',
    white: '#fff',
};

const SPACING = {
    cardGap: '30px',
    cardMinHeight: '500px',
    cardPadding: '24px 54px 28px',
    columnWidth: '260px',
    rowGap: '12px',
    rowHeight: '66px',
    rowPadding: '14px 0 4px',
} as const;

const TYPO = {
    body: { fontSize: '36px', letterSpacing: '-0.72px', lineHeight: '40px' },
    header: { fontSize: '36px', letterSpacing: '-0.72px', lineHeight: '37.7px' },
    memo: { fontSize: '34px', letterSpacing: '-0.68px' },
} as const;

const headerTextStyle = TYPO.header;

const columnLabelStyle = {
    color: colors.neutral500,
    ...TYPO.body,
    width: SPACING.columnWidth,
} as const;

const addressStyle = {
    color: colors.emerald700,
    ...TYPO.body,
    width: SPACING.columnWidth,
} as const;

const tableDataRowStyle = {
    alignItems: 'center',
    borderBottom: `2px dashed ${colors.heavyMetal200}`,
    display: 'flex',
    height: SPACING.rowHeight,
    padding: SPACING.rowPadding,
    width: '100%',
} as const;

const amountCellStyle = {
    alignItems: 'center',
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-end',
} as const;

const amountTextStyle = {
    fontSize: TYPO.body.fontSize,
    lineHeight: TYPO.body.lineHeight,
} as const;
