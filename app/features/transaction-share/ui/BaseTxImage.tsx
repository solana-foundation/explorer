import { truncateAddress } from '@entities/address';
import { type InstructionSummary, UNKNOWN_PROGRAM_NAME } from '@entities/transaction-data';

import { Logo } from '@/app/shared/components/SolanaLogo';
import { pluralWord } from '@/app/utils';

import { MAX_INSTRUCTION_ROWS } from '../lib/constants';
import type { TxShareData } from '../model/get-tx-share-data';

// The design writes the signature as eight characters a side.
const SIGNATURE_PAD = 8;

// Every address that is not the headline signature: the fee payer cell and an unnamed program's id.
const ADDRESS_PAD = 6;

// Placeholder for an absent value.
const EMPTY_VALUE = '-';

const TEXT_ELLIPSIS = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const;

const COLORS = {
    background: '#141917',
    emphasis: '#FFFFFF',
    footerLabel: '#A0AAA5',
    secondary: '#BAC4C0',
    signature: '#2DD4A7',
} as const;

const PILL = {
    failed: { background: '#F43F5E1F', border: '#F43F5E59', text: '#FF8095' },
    success: { background: '#0EA4761F', border: '#2DD4A759', text: '#2DD4A7' },
} as const;

const TYPO = {
    /** The instruction rows, the widest band on the card. */
    body: { fontSize: '30px', lineHeight: '36px' },
    /** Date, pill label, every footer cell. */
    caption: { fontSize: '26px', lineHeight: '31px' },
    /** "Transaction" and the signature beside it. */
    headline: { fontSize: '60px' },
    /** "Explorer", beside the logo. */
    wordmark: { fontSize: '37px', fontWeight: 400 },
} as const;

const SPACING = {
    /** Shared by an instruction row and the "and N more" line below them, which reads as one of them. */
    rowPadding: '14px 0',
} as const;

const LOGO = { height: '28px', width: '229px' } as const;

type BaseTxImageProps = {
    data: TxShareData | undefined;
    /** Both glows are base64 data URIs. */
    glows: { failed: string; success: string };
};

export function BaseTxImage({ data, glows }: BaseTxImageProps) {
    // A card with no transaction has no status to colour, so it takes the success glow.
    const glow = data?.status === 'failed' ? glows.failed : glows.success;

    return (
        <div
            style={{
                alignItems: 'flex-start',
                backgroundColor: COLORS.background,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                justifyContent: 'space-between',
                overflow: 'hidden',
                padding: '52px 65px 92px',
                position: 'relative',
                width: '100%',
            }}
        >
            <div
                data-testid="tx-image-glow"
                style={{
                    backgroundImage: `url(${glow})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '100% 100%',
                    display: 'flex',
                    height: '100%',
                    left: 0,
                    position: 'absolute',
                    top: 0,
                    width: '100%',
                }}
            />

            <Header dateUtc={data?.dateUtc} status={data?.status} />
            {/* Three flat siblings, never a fragment: satori wraps a fragment's children in one implicit
                row box, which lays the footer out beside the body instead of below it. */}
            {data && <Body data={data} />}
            {data && <Footer data={data} />}
            {!data && <NoTransaction />}
        </div>
    );
}

function Header({ dateUtc, status }: { dateUtc: string | undefined; status: TxShareData['status'] }) {
    return (
        <div
            style={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'space-between',
                position: 'relative',
                width: '100%',
            }}
        >
            <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
                <Logo variant="green" style={{ color: COLORS.emphasis, ...LOGO }} />
                <span style={{ color: COLORS.emphasis, ...TYPO.wordmark }}>Explorer</span>
            </div>

            <div
                style={{
                    alignItems: 'center',
                    display: 'flex',
                    gap: '22px',
                    marginTop: '2px',
                }}
            >
                {dateUtc && (
                    <span data-testid="tx-image-date" style={{ color: COLORS.secondary, ...TYPO.caption }}>
                        {dateUtc}
                    </span>
                )}
                {status && <StatusBadge status={status} />}
            </div>
        </div>
    );
}

function Body({ data }: { data: TxShareData }) {
    const visible = data.instructions.slice(0, MAX_INSTRUCTION_ROWS);
    const overflow = data.instructions.length - visible.length;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                // Between the headline and the first instruction row.
                gap: '2px',
                position: 'relative',
                width: '100%',
            }}
        >
            {/* Tx with signature */}
            <div style={{ alignItems: 'flex-end', display: 'flex', gap: '16px', width: '100%' }}>
                <span style={{ color: COLORS.secondary, ...TYPO.headline, lineHeight: '66px' }}>Transaction</span>
                <span
                    data-testid="tx-image-signature"
                    style={{
                        color: COLORS.signature,
                        fontFamily: 'Roboto Mono',
                        fontWeight: 500,
                        lineHeight: '72px',
                        ...TYPO.headline,
                    }}
                >
                    {truncateAddress(data.signature, SIGNATURE_PAD)}
                </span>
            </div>
            {/* Instruction rows */}
            <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '8px', width: '100%' }}>
                {visible.map((instruction, index) => (
                    <InstructionRow instruction={instruction} key={index} />
                ))}

                {overflow > 0 && (
                    <span
                        data-testid="tx-image-instruction-overflow"
                        style={{
                            color: COLORS.secondary,
                            padding: SPACING.rowPadding,
                            ...TYPO.body,
                        }}
                    >
                        {`and ${overflow} more ${pluralWord(overflow, 'instruction')}`}
                    </span>
                )}
            </div>
        </div>
    );
}

function InstructionRow({ instruction }: { instruction: InstructionSummary }) {
    return (
        <div
            data-testid="tx-image-instruction"
            style={{
                alignItems: 'flex-end',
                display: 'flex',
                gap: '12px',
                padding: SPACING.rowPadding,
                width: '100%',
            }}
        >
            <span style={{ color: COLORS.secondary, flexShrink: 0, ...TYPO.body, whiteSpace: 'nowrap' }}>
                {programLabel(instruction)}
            </span>
            <span
                style={{
                    color: COLORS.emphasis,
                    // The one thing on the row that gives way. Written out for satori, which defaults it
                    // to 0; `minWidth: 0` is what lets a browser shrink it below its content.
                    flexShrink: 1,
                    fontWeight: 500,
                    minWidth: 0,
                    ...TYPO.body,
                    ...TEXT_ELLIPSIS,
                }}
            >
                {instruction.name}
            </span>
        </div>
    );
}

function Footer({ data }: { data: TxShareData }) {
    return (
        <div
            data-testid="tx-image-footer"
            style={{
                alignItems: 'flex-end',
                display: 'flex',
                gap: '24px',
                justifyContent: 'space-between',
                marginBottom: '8px',
                position: 'relative',
                width: '100%',
            }}
        >
            {footerCells(data).map(cell => (
                <div key={cell.label} style={{ alignItems: 'flex-end', display: 'flex', gap: '10px' }}>
                    <span style={{ color: COLORS.footerLabel, ...TYPO.caption }}>{cell.label}</span>
                    <span
                        style={{
                            color: COLORS.secondary,
                            ...(cell.mono ? { fontFamily: 'Roboto Mono' } : {}),
                            ...TYPO.caption,
                        }}
                    >
                        {cell.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

/**
 * The program's name, or the name plus its truncated address when nothing named it.
 */
function programLabel({ nameLookup, programName }: InstructionSummary): string {
    if (programName !== UNKNOWN_PROGRAM_NAME || !nameLookup) return programName;

    return `${programName} (${truncateAddress(nameLookup.programId, ADDRESS_PAD)})`;
}

/**
 * The four footer cells, always all four.
 * An absent value prints {@link EMPTY_VALUE} rather than dropping its cell.
 */
function footerCells(data: TxShareData): { label: string; mono?: boolean; value: string }[] {
    return [
        { label: 'Fee', value: data.fee ?? EMPTY_VALUE },
        { label: 'Slot', value: data.slot.toLocaleString('en-US') },
        { label: 'Version', value: data.version ?? EMPTY_VALUE },
        {
            label: 'Fee payer',
            mono: true,
            value: data.signer ? truncateAddress(data.signer, ADDRESS_PAD) : EMPTY_VALUE,
        },
    ];
}

function StatusBadge({ status }: { status: NonNullable<TxShareData['status']> }) {
    const pill = status === 'failed' ? PILL.failed : PILL.success;

    return (
        <span
            data-testid="tx-image-status"
            style={{
                backgroundColor: pill.background,
                border: `1px solid ${pill.border}`,
                borderRadius: '999px',
                color: pill.text,
                fontWeight: 500,
                padding: '8px 22px',
                ...TYPO.caption,
            }}
        >
            {status === 'failed' ? 'Failed' : 'Success'}
        </span>
    );
}

function NoTransaction() {
    return (
        <div
            data-testid="tx-image-fallback"
            style={{
                alignItems: 'center',
                display: 'flex',
                flexGrow: 1,
                justifyContent: 'center',
                position: 'relative',
            }}
        >
            <span
                style={{
                    color: COLORS.secondary,
                    fontSize: '48px',
                    fontWeight: 400,
                    textAlign: 'center',
                }}
            >
                See the transaction details on the Solana Explorer.
            </span>
        </div>
    );
}
