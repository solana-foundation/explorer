import { truncateAddress } from '@entities/address';

import { Logo } from '@/app/shared/components/SolanaLogo';

import type { OgGlows } from '../lib/og-glows';
import type {
    AccountCardData,
    AccountShareData,
    MarkerState,
    NotFoundReason,
    ProgramCardData,
    ProgramMarkers,
} from '../model/account-share-data';
import { MarkerIcon, type MarkerIconName } from './marker-icons';

// Every address on the card is written as six characters a side, the width the design uses for account keys.
const ADDRESS_PAD = 6;

const COLORS = {
    accent: '#2DD4A7',
    alert: '#F0B24A',
    background: '#141917',
    emphasis: '#FFFFFF',
    footerLabel: '#A0AAA5',
    muted: '#A0AAA5',
    secondary: '#BAC4C0',
} as const;

// The amber pill a not-found card shows in place of a type label.
const PILL = {
    background: '#F59E0B1F',
    border: '#F0B24A59',
    text: '#F0B24A',
} as const;

const TYPO = {
    /** Header-right owner/type, footer cells, the not-found reason line. */
    caption: { fontSize: '26px', lineHeight: '31px' },
    /** "Balance 2.03928144 SOL", the program name - the widest band on the card. */
    headline: { fontSize: '60px', lineHeight: '66px' },
    /** The identity address, the activity line, program markers. */
    lead: { fontSize: '34px', lineHeight: '41px' },
    /** "Explorer", beside the logo. */
    wordmark: { fontSize: '37px', fontWeight: 400 },
} as const;

const LOGO = { height: '28px', width: '229px' } as const;

const NOT_FOUND_COPY: Record<NotFoundReason, { headline: string; pill: string; reason: string }> = {
    'has-history': {
        headline: 'No account data found',
        pill: 'Not found',
        // History exists but does not prove the account ever did (a failed creation leaves history too), so
        // this stops short of claiming the account was closed.
        reason: 'This address has on-chain transaction history but holds no account data on this cluster.',
    },
    'never-used': {
        headline: 'No account data found',
        pill: 'Not found',
        reason: 'No account data was found for this address on this cluster.',
    },
    unknown: {
        headline: 'No account data found',
        pill: 'Not found',
        reason: 'No account data could be loaded for this address on this cluster.',
    },
};

type BaseAccountImageProps = {
    data: AccountShareData | undefined;
    /** Both glows are base64 data URIs. */
    glows: OgGlows;
};

export function BaseAccountImage({ data, glows }: BaseAccountImageProps) {
    // A missing account signals absence, which takes the amber glow; everything else takes the green one.
    const glow = data?.kind === 'not-found' ? glows.notFound : glows.success;

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
                data-testid="account-image-glow"
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

            <Header data={data} />
            {/* Three flat siblings, never a fragment: satori wraps a fragment's children in one implicit
                row box, which lays the footer out beside the body instead of below it. */}
            {data?.kind === 'account' && <AccountBody data={data} />}
            {data?.kind === 'account' && <AccountFooter data={data} />}
            {data?.kind === 'program' && <ProgramBody data={data} />}
            {data?.kind === 'program' && <ProgramFooter data={data} />}
            {data?.kind === 'not-found' && <NotFoundBody address={data.address} reason={data.reason} />}
            {data?.kind === 'not-found' && <NotFoundFooter reason={data.reason} />}
            {!data && <NoAccount />}
        </div>
    );
}

function Header({ data }: { data: AccountShareData | undefined }) {
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

            <div style={{ alignItems: 'center', display: 'flex', marginTop: '2px' }}>
                <HeaderRight data={data} />
            </div>
        </div>
    );
}

// Returns one element per case, never a fragment: satori collapses a fragment's children into a single
// implicit row box, which would drop the 22px gap between the owner and the type label.
function HeaderRight({ data }: { data: AccountShareData | undefined }) {
    if (!data) return <></>;

    if (data.kind === 'not-found') {
        return <Pill label={NOT_FOUND_COPY[data.reason].pill} />;
    }

    if (data.kind === 'program') {
        return <TypeLabel label="Program" />;
    }

    return (
        <div style={{ alignItems: 'center', display: 'flex', gap: '22px' }}>
            {data.owner && (
                <div data-testid="account-image-owner" style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
                    <span style={{ color: COLORS.secondary, ...TYPO.caption }}>Owned by</span>
                    <span
                        style={{
                            color: COLORS.secondary,
                            fontFamily: 'Roboto Mono',
                            ...TYPO.caption,
                            lineHeight: '34px',
                        }}
                    >
                        {truncateAddress(data.owner, ADDRESS_PAD)}
                    </span>
                </div>
            )}
            <TypeLabel label="Account" />
        </div>
    );
}

function TypeLabel({ label }: { label: string }) {
    return (
        <span data-testid="account-image-type" style={{ color: COLORS.emphasis, fontWeight: 500, ...TYPO.caption }}>
            {label}
        </span>
    );
}

function AccountBody({ data }: { data: AccountCardData }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', position: 'relative', width: '100%' }}>
            <Headline>
                <span style={{ color: COLORS.secondary, ...TYPO.headline }}>Balance</span>
                <span
                    data-testid="account-image-balance"
                    style={{ color: COLORS.emphasis, fontWeight: 500, ...TYPO.headline }}
                >
                    {data.balance}
                </span>
            </Headline>
            <Identity address={data.address} />
            {(data.transactionCount || data.lastActivity) && (
                // Flat siblings, never a fragment: the 14px gap is what spaces the count from its unit and
                // the dot, and satori would swallow it inside a fragment's implicit box.
                <div style={{ alignItems: 'baseline', display: 'flex', gap: '14px', paddingTop: '12px' }}>
                    {data.transactionCount && (
                        <span
                            data-testid="account-image-tx-count"
                            style={{ color: COLORS.emphasis, fontWeight: 500, ...TYPO.lead }}
                        >
                            {data.transactionCountIsCapped ? `${data.transactionCount}+` : data.transactionCount}
                        </span>
                    )}
                    {data.transactionCount && (
                        <span style={{ color: COLORS.secondary, ...TYPO.lead }}>
                            {data.transactionCount === '1' ? 'transaction' : 'transactions'}
                        </span>
                    )}
                    {data.transactionCount && data.lastActivity && (
                        <span style={{ color: COLORS.muted, ...TYPO.lead }}>·</span>
                    )}
                    {data.lastActivity && (
                        <span style={{ color: COLORS.secondary, ...TYPO.lead }}>{`last ${data.lastActivity}`}</span>
                    )}
                </div>
            )}
        </div>
    );
}

function AccountFooter({ data }: { data: AccountCardData }) {
    return (
        <Footer>
            <InlineCell label="Data size" value={data.dataSize} />
            <InlineCell label="Executable" value={data.executable ? 'Yes' : 'No'} />
        </Footer>
    );
}

function ProgramBody({ data }: { data: ProgramCardData }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', position: 'relative', width: '100%' }}>
            <Headline>
                <span
                    data-testid="account-image-program-name"
                    style={{
                        color: COLORS.emphasis,
                        flexShrink: 1,
                        fontWeight: 500,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        ...TYPO.headline,
                    }}
                >
                    {data.name}
                </span>
            </Headline>
            <Identity address={data.address} />
            <div style={{ alignItems: 'center', display: 'flex', gap: '26px', paddingTop: '12px' }}>
                {MARKER_KEYS.map(key => {
                    const { icon, label, tone } = MARKER_DISPLAY[key][data.markers[key]];
                    return <Marker icon={icon} key={key} label={label} tone={tone} />;
                })}
            </div>
        </div>
    );
}

function ProgramFooter({ data }: { data: ProgramCardData }) {
    return (
        <Footer>
            {data.upgradeAuthority && (
                <StackedCell label="Upgrade authority">
                    {data.upgradeAuthority.address && (
                        <span
                            style={{
                                color: COLORS.accent,
                                fontFamily: 'Roboto Mono',
                                ...TYPO.caption,
                                lineHeight: '34px',
                            }}
                        >
                            {truncateAddress(data.upgradeAuthority.address, ADDRESS_PAD)}
                        </span>
                    )}
                    {data.upgradeAuthority.address && data.upgradeAuthority.note && (
                        <span style={{ color: COLORS.muted, ...TYPO.caption }}>·</span>
                    )}
                    {data.upgradeAuthority.note && (
                        <span style={{ color: COLORS.secondary, ...TYPO.caption }}>{data.upgradeAuthority.note}</span>
                    )}
                </StackedCell>
            )}
            {data.lastDeployedSlot !== undefined && (
                <StackedCell label="Last deployed">
                    <span style={{ color: COLORS.secondary, ...TYPO.caption }}>
                        {`Slot ${data.lastDeployedSlot.toLocaleString('en-US')}`}
                    </span>
                </StackedCell>
            )}
            {data.programSize && (
                <StackedCell label="Program size">
                    <span style={{ color: COLORS.secondary, ...TYPO.caption }}>{data.programSize}</span>
                </StackedCell>
            )}
        </Footer>
    );
}

function Headline({ children }: { children: React.ReactNode }) {
    return <div style={{ alignItems: 'baseline', display: 'flex', gap: '16px', width: '100%' }}>{children}</div>;
}

function Identity({ address }: { address: string }) {
    return (
        <div style={{ display: 'flex', paddingTop: '18px' }}>
            <span
                data-testid="account-image-address"
                style={{
                    color: COLORS.accent,
                    fontFamily: 'Roboto Mono',
                    fontWeight: 500,
                    ...TYPO.lead,
                    lineHeight: '44px',
                }}
            >
                {truncateAddress(address, ADDRESS_PAD)}
            </span>
        </div>
    );
}

function Footer({ children }: { children: React.ReactNode }) {
    return (
        <div
            data-testid="account-image-footer"
            style={{
                alignItems: 'flex-end',
                display: 'flex',
                gap: '48px',
                marginBottom: '8px',
                position: 'relative',
                width: '100%',
            }}
        >
            {children}
        </div>
    );
}

/** A footer cell that reads `label value` on one line, the shape the universal account card uses. */
function InlineCell({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ alignItems: 'flex-end', display: 'flex', gap: '10px' }}>
            <span style={{ color: COLORS.footerLabel, ...TYPO.caption }}>{label}</span>
            <span style={{ color: COLORS.secondary, ...TYPO.caption }}>{value}</span>
        </div>
    );
}

/** A footer cell that stacks its value under the label, the shape the program card uses. */
function StackedCell({ children, label }: { children: React.ReactNode; label: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ color: COLORS.footerLabel, ...TYPO.caption }}>{label}</span>
            <div style={{ alignItems: 'baseline', display: 'flex', gap: '8px' }}>{children}</div>
        </div>
    );
}

type MarkerTone = 'alert' | 'muted' | 'positive';

type MarkerDisplay = { icon: MarkerIconName; label: string; tone: MarkerTone };

// The markers, in draw order.
const MARKER_KEYS = ['verifiedBuild', 'idlUploaded', 'securityTxt'] as const satisfies ReadonlyArray<
    keyof ProgramMarkers
>;

// How each marker renders per state. `unknown` (lookup failed or check not supported) stays muted with
// neutral copy so the card never asserts a negative ("Not verified" / "No IDL") it could not actually check.
const MARKER_DISPLAY: Record<keyof ProgramMarkers, Record<MarkerState, MarkerDisplay>> = {
    idlUploaded: {
        no: { icon: 'file-x', label: 'No IDL', tone: 'muted' },
        unknown: { icon: 'file-x', label: 'IDL unavailable', tone: 'muted' },
        yes: { icon: 'file-code', label: 'IDL uploaded', tone: 'positive' },
    },
    securityTxt: {
        no: { icon: 'shield-off', label: 'No security.txt', tone: 'muted' },
        unknown: { icon: 'shield-off', label: 'security.txt unavailable', tone: 'muted' },
        yes: { icon: 'shield-check', label: 'security.txt', tone: 'positive' },
    },
    verifiedBuild: {
        no: { icon: 'badge-alert', label: 'Not verified', tone: 'alert' },
        unknown: { icon: 'badge-alert', label: 'Verification unavailable', tone: 'muted' },
        yes: { icon: 'badge-check', label: 'Verified build', tone: 'positive' },
    },
};

// A positive marker keeps a white label beside a green icon; an alert one is amber, a muted one grey.
function Marker({ icon, label, tone }: { icon: MarkerIconName; label: string; tone: MarkerTone }) {
    const color = tone === 'positive' ? COLORS.emphasis : tone === 'alert' ? COLORS.alert : COLORS.muted;
    const iconColor = tone === 'positive' ? COLORS.accent : color;

    return (
        <div data-testid="account-image-marker" style={{ alignItems: 'center', display: 'flex', gap: '10px' }}>
            <MarkerIcon color={iconColor} name={icon} />
            <span style={{ color, ...TYPO.lead }}>{label}</span>
        </div>
    );
}

function Pill({ label }: { label: string }) {
    return (
        <span
            data-testid="account-image-pill"
            style={{
                backgroundColor: PILL.background,
                border: `1px solid ${PILL.border}`,
                borderRadius: '999px',
                color: PILL.text,
                fontWeight: 500,
                padding: '8px 22px',
                ...TYPO.caption,
            }}
        >
            {label}
        </span>
    );
}

function NotFoundBody({ address, reason }: { address: string; reason: NotFoundReason }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', position: 'relative', width: '100%' }}>
            <Headline>
                <span style={{ color: COLORS.emphasis, fontWeight: 500, ...TYPO.headline }}>
                    {NOT_FOUND_COPY[reason].headline}
                </span>
            </Headline>
            <Identity address={address} />
        </div>
    );
}

function NotFoundFooter({ reason }: { reason: NotFoundReason }) {
    return (
        <div
            data-testid="account-image-footer"
            style={{ display: 'flex', marginBottom: '8px', position: 'relative', width: '100%' }}
        >
            <span
                data-testid="account-image-reason"
                // About half the content width, so the sentence wraps to two short lines as the design does.
                style={{ color: COLORS.secondary, maxWidth: '620px', ...TYPO.caption, lineHeight: '33px' }}
            >
                {NOT_FOUND_COPY[reason].reason}
            </span>
        </div>
    );
}

function NoAccount() {
    return (
        <div
            data-testid="account-image-fallback"
            style={{
                alignItems: 'center',
                display: 'flex',
                flexGrow: 1,
                justifyContent: 'center',
                position: 'relative',
            }}
        >
            <span style={{ color: COLORS.secondary, fontSize: '48px', fontWeight: 400, textAlign: 'center' }}>
                See the account details on the Solana Explorer.
            </span>
        </div>
    );
}
