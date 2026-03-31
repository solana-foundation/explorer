import { Logo } from '@/app/shared/components/SolanaLogo';

export const IMAGE_SIZE = {
    height: 630,
    width: 1200,
};

export const MAX_TITLE_LENGTH = 100;

type BaseFeatureGateImageProps = {
    title: string;
    simds: string[];
};

export function BaseFeatureGateImage({ title, simds }: BaseFeatureGateImageProps) {
    const simdLabel = simds.length > 0 ? simds.map(s => `SIMD-${s.padStart(4, '0')}`).join(', ') : undefined;
    const displayTitle = title.length > MAX_TITLE_LENGTH ? `${title.slice(0, MAX_TITLE_LENGTH)}…` : title;

    return (
        <div
            style={{
                backgroundColor: colors.background,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                position: 'relative',
                width: '100%',
            }}
        >
            {/* Green gradient glow — large diffuse wash centered slightly above middle */}
            <div
                style={{
                    background:
                        'radial-gradient(ellipse 120% 110% at 50% 40%, rgba(0, 90, 55, 0.55) 0%, rgba(0, 60, 40, 0.25) 40%, transparent 70%)',
                    display: 'flex',
                    height: '100%',
                    position: 'absolute',
                    width: '100%',
                }}
            />

            {/* Logo top-left */}
            <div
                style={{
                    alignItems: 'center',
                    display: 'flex',
                    gap: '18px',
                    left: '76px',
                    position: 'absolute',
                    top: '36px',
                }}
            >
                <Logo variant="green" style={{ color: colors.white, height: '26px', width: '229px' }} />
                <span
                    style={{
                        color: colors.neutral50,
                        fontSize: '36px',
                        fontWeight: 400,
                    }}
                >
                    Explorer
                </span>
            </div>

            {/* SIMD + title bottom-left */}
            <div
                style={{
                    bottom: '64px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    left: '76px',
                    position: 'absolute',
                    width: '1048px',
                }}
            >
                {simdLabel && (
                    <span
                        style={{
                            color: colors.neutral400,
                            fontFamily: 'monospace',
                            fontSize: '48px',
                            fontWeight: 400,
                            letterSpacing: '-0.96px',
                        }}
                    >
                        {simdLabel}
                    </span>
                )}

                <span
                    style={{
                        color: colors.neutral100,
                        fontSize: '64px',
                        fontWeight: 400,
                        letterSpacing: '-1.28px',
                        lineHeight: 1.25,
                    }}
                >
                    {displayTitle}
                </span>
            </div>
        </div>
    );
}

const colors = {
    background: '#161a18',
    neutral100: '#f5f5f5',
    neutral400: '#a1a1a1',
    neutral50: '#fafafa',
    white: '#fff',
};
