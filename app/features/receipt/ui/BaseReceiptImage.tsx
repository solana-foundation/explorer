import type { FormattedReceipt } from '../types';
import { BottomLine } from './BottomLine';
import { Logo } from './Logo';

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

export function BaseReceiptImage({ data, options }: BaseReceiptImageProps) {
    const size = options?.size || IMAGE_SIZE;

    if (!data) return <NoReceipt size={size} />;

    const { sender, receiver, date, memo, fee, total } = data;
    const truncatedMemo = memo ? (memo.length > 90 ? memo.substring(0, 90) + '...' : memo) : undefined;

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
                                    <span
                                        style={{
                                            color: colors.emerald700,
                                        }}
                                    >
                                        {receiver.truncated}
                                    </span>
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

                    <Footer fee={fee.formatted} total={total.formatted} />
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
            <div
                style={{
                    alignItems: 'center',
                    display: 'flex',
                    gap: '12px',
                }}
            >
                <Logo style={{ color: colors.heavyMetal800, height: '26px', width: '229px' }} />

                <span
                    style={{
                        color: colors.heavyMetal800,
                        fontSize: '35px',
                        fontWeight: 500,
                    }}
                >
                    Receipt
                </span>
            </div>
        </div>
    );
}

function Footer({ fee, total }: { fee?: string; total?: string }) {
    if (!total) return null;
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
    return (
        <span
            style={{
                color: colors.neutral500,
                fontSize: '36px',
                lineHeight: '1em',
            }}
        >
            {text}
        </span>
    );
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
    destructive: '#f765fb',
    emerald700: '#0ea476',
    emerald900: '#053D2C',
    heavyMetal800: '#29302c',
    neutral200: '#e5e5e5',
    neutral500: '#737373',
    outerSpace900: '#1d2322',
    outerSpace950: '#101413',
    white: '#fff',
};
