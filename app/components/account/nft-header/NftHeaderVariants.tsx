'use client';

import { Address } from '@components/common/Address';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/shared/ui/tooltip';
import solanaLogo from '@img/logos-solana/low-contrast-solana-logo.svg';
import { PublicKey } from '@solana/web3.js';
import { useClusterPath } from '@utils/url';
import { cva } from 'class-variance-authority';
import Link from 'next/link';
import { type CSSProperties, Fragment, type ReactNode, useState } from 'react';

import type { NftCollection, NftCreator, NftHeaderModel } from '@/app/components/account/nft-header/model';
import { OriginalImageDialog } from '@/app/components/account/nft-header/OriginalImageDialog';
import { Badge } from '@/app/components/shared/ui/badge';
import { ExternalLinkMark } from '@/app/components/shared/ui/external-link';
import { Skeleton } from '@/app/components/shared/ui/skeleton';
import { cn } from '@/app/components/shared/utils';
import { ProxiedImage } from '@/app/features/metadata';
import { getSafeExternalHref } from '@/app/shared/lib/url';
import { LABEL_WIDTH } from '@/app/shared/ui/key-value';

export function NftHeaderLayout({ model }: { model: NftHeaderModel }) {
    return (
        <SplitLayout
            art={<NftArt uri={model.image} onCard />}
            label={model.typeLabel}
            name={<h2 className={CARD_NAME_CLASSES}>{model.name}</h2>}
            specs={<FactStrip facts={modelFacts(model)} />}
        />
    );
}

type NftFact = { label: string; value: ReactNode };

function modelFacts(model: NftHeaderModel): NftFact[] {
    const facts: (NftFact | false)[] = [
        { label: 'Symbol', value: model.symbol ?? <Muted /> },
        // Compressed NFTs have no edition accounts.
        !model.compressed && { label: 'Edition', value: model.edition ?? <Muted /> },
        {
            label: 'Collection',
            value: model.collection ? <CollectionLink collection={model.collection} /> : <Muted />,
        },
        model.compressed && { label: 'Storage', value: <Hint text={COMPRESSED_TOOLTIP}>Compressed</Hint> },
        hasOriginal(model.image) && { label: 'Original', value: <OriginalLink uri={model.image} /> },
    ];
    return facts.filter((fact): fact is NftFact => fact !== false);
}

type SplitLayoutProps = {
    art: ReactNode;
    label: string;
    name: ReactNode;
    specs: ReactNode;
};

function SplitLayout({ art, label, name, specs }: SplitLayoutProps) {
    return (
        <div className="grid w-full gap-1.5 max-sm:-mt-5 sm:grid-cols-[fit-content(min(322px,calc(50%-0.375rem)))_minmax(0,1fr)] sm:gap-3">
            <div className={cn(CARD_SURFACE, 'w-fit min-w-0 max-w-full self-start overflow-hidden max-sm:mx-auto')}>
                {art}
            </div>
            <div
                className={cn(
                    CARD_SURFACE,
                    SPLIT_PADDING,
                    'flex min-w-0 flex-col justify-between gap-3 max-sm:pt-2.5 sm:pt-[9px]',
                )}
            >
                <div className="min-w-0">
                    <CardHeading label={label} name={name} />
                </div>
                <div className="min-w-0 overflow-hidden max-sm:-mx-3 max-sm:-mb-3 max-sm:border-0 max-sm:border-t max-sm:border-solid max-sm:border-outer-space-800">
                    {specs}
                </div>
            </div>
        </div>
    );
}

const SPLIT_PADDING = 'p-3';

function CardHeading({ label, name }: Pick<SplitLayoutProps, 'label' | 'name'>) {
    return (
        <div className="flex flex-col">
            <div className="-mb-1 flex min-h-7 items-center gap-3">
                <span className="text-xs font-normal uppercase text-outer-space-300">{label}</span>
            </div>
            {name}
        </div>
    );
}

const CARD_SURFACE = 'rounded-lg border border-solid border-outer-space-800 bg-outer-space-900';

const CARD_NAME_CLASSES = 'm-0 break-words text-[30px] font-normal leading-tight text-white sm:text-[42px]';

function FactStrip({ facts }: { facts: NftFact[] }) {
    return (
        <dl className={FACT_STRIP_CLASSES}>
            {facts.map(({ label, value }) => (
                <div key={label} className={FACT_ROW_CLASSES}>
                    <dt className={cn('flex-none text-sm font-normal text-outer-space-300', LABEL_WIDTH, 'sm:w-20')}>
                        {label}
                    </dt>
                    {/* `overflow-hidden`: an address measures its full text in a hidden span, which would otherwise widen the page on a phone. */}
                    <dd className="m-0 min-w-0 flex-1 overflow-hidden text-sm text-white">{value}</dd>
                </div>
            ))}
        </dl>
    );
}

const FACT_STRIP_CLASSES = 'm-0 -mb-px -mr-px grid grid-cols-1 sm:m-0 sm:gap-y-2';

const FACT_ROW_CLASSES =
    'flex min-w-0 flex-row items-baseline gap-dk-4 border-0 border-b border-r border-solid border-outer-space-800 px-3 py-2.5 sm:gap-4 sm:border-0 sm:p-0';

const ART_FRAME_CLASSES = 'relative flex w-fit min-w-0 max-w-full flex-col items-start self-start max-sm:mx-auto';

const ART_RADIUS = { false: 'rounded-lg', true: 'rounded' } as const;

// `sized` width is set per breakpoint through CSS variables, since an inline width can't follow a media query.
const nftArtVariants = cva('block h-auto max-h-[520px] max-w-full max-sm:max-h-[540px]', {
    defaultVariants: { onCard: false, sized: false },
    variants: {
        onCard: ART_RADIUS,
        sized: { false: 'w-auto', true: 'w-[var(--art-w)] max-sm:w-[var(--art-w-phone)]' },
    },
});

// The loading square needs a width of its own, because the art's slot takes its width from what it holds.
const nftArtPlaceholderVariants = cva(
    'aspect-square w-[min(520px,calc(100vw-2rem))] max-w-full max-sm:w-[min(540px,calc(100vw-2rem))]',
    {
        defaultVariants: { onCard: false },
        variants: { onCard: ART_RADIUS },
    },
);

const ART_PIXELS = 320;
const MAX_HEIGHT = 520;
const MAX_HEIGHT_PHONE = 540;
// Art this small is almost always pixel art, drawn to be enlarged with hard edges.
const PIXEL_ART_MAX_SIDE = 256;

function NftArt({ uri, onCard = false }: { uri?: string; onCard?: boolean }) {
    // Tied to its uri so a new image starts from scratch.
    const [natural, setNatural] = useState<{ uri?: string; width: number; height: number }>();
    const loaded = natural?.uri === uri ? natural : undefined;

    return (
        <div className={ART_FRAME_CLASSES}>
            <ProxiedImage
                alt="nft"
                className={nftArtVariants({ onCard, sized: loaded !== undefined && artStyle(loaded) !== undefined })}
                height={ART_PIXELS}
                onLoad={event =>
                    setNatural({
                        height: event.currentTarget.naturalHeight,
                        uri,
                        width: event.currentTarget.naturalWidth,
                    })
                }
                placeholder={<Skeleton className={nftArtPlaceholderVariants({ onCard })} />}
                fallback={failure => <NftArtFallback onCard={onCard} reason={failure?.reason} />}
                style={loaded ? artStyle(loaded) : undefined}
                uri={uri}
                width={ART_PIXELS}
            />
        </div>
    );
}

function NftArtFallback({ onCard, reason }: { onCard: boolean; reason?: string }) {
    return (
        <div
            className={cn(nftArtPlaceholderVariants({ onCard }), 'overflow-hidden bg-[#212b2a]')}
            data-testid="nft-art-fallback"
        >
            {/* eslint-disable-next-line @next/next/no-img-element -- the fallback carries the failure reason, as in `ProxiedImage` */}
            <img alt={reason ?? ''} className="block size-full" src={solanaLogo.src} title={reason} />
        </div>
    );
}

// Width that makes the art exactly as tall as the cap; small art keeps hard pixel edges instead of the browser's blur.
function artStyle({ width, height }: { width: number; height: number }): CSSProperties | undefined {
    if (width === 0 || height === 0) return undefined;
    return {
        '--art-w': `${Math.round((MAX_HEIGHT * width) / height)}px`,
        '--art-w-phone': `${Math.round((MAX_HEIGHT_PHONE * width) / height)}px`,
        imageRendering: Math.max(width, height) <= PIXEL_ART_MAX_SIDE ? 'pixelated' : undefined,
    } as CSSProperties;
}

// A click always asks first (`OriginalImageDialog`), which names the site, so no hint opens on hover.
function OriginalLink({ uri }: { uri?: string }) {
    if (!hasOriginal(uri)) return undefined;

    const trigger = (
        <button
            type="button"
            className="inline-flex border-0 bg-transparent p-0 text-left text-sm text-[#33a382] hover:text-[#2b8a6e]"
        >
            {/* One flex item, so the button's baseline is its first line's once the site wraps. */}
            <span>
                <SiteName hostname={new URL(uri).hostname} />
                <ExternalLinkMark />
            </span>
        </button>
    );

    return <OriginalImageDialog uri={uri}>{trigger}</OriginalImageDialog>;
}

function hasOriginal(uri: string | undefined): uri is string {
    return !!uri && !!getSafeExternalHref(uri);
}

/** A site's name that wraps after its dots (`<wbr>`), not in the middle of a word. */
function SiteName({ hostname }: { hostname: string }) {
    const parts = hostname.split('.');
    return (
        <>
            {parts.map((part, index) => (
                <Fragment key={index}>
                    {part}
                    {index < parts.length - 1 && (
                        <>
                            .<wbr />
                        </>
                    )}
                </Fragment>
            ))}
        </>
    );
}

function Pill({
    tooltip,
    variant = 'gray',
    children,
}: {
    tooltip?: string;
    variant?: 'gray' | 'success';
    children: ReactNode;
}) {
    const badge = (
        <Badge variant={variant} size="sm" className={tooltip ? 'cursor-help' : undefined}>
            {children}
        </Badge>
    );
    if (!tooltip) return badge;
    return (
        <Tooltip>
            <TooltipTrigger asChild>{badge}</TooltipTrigger>
            <TooltipContent className="max-w-64">{tooltip}</TooltipContent>
        </Tooltip>
    );
}

function CollectionLink({ collection }: { collection: NftCollection }) {
    const path = useClusterPath({ pathname: `/address/${collection.address}` });
    return (
        <span className="flex min-w-0 items-baseline gap-2">
            {/* A plain link, not `Address`: a header names the collection the way its creators did, not by the viewer's nickname. */}
            <Link href={path} className={collectionLinkVariants({ named: collection.name !== undefined })}>
                {collection.name ?? shortAddress(collection.address)}
            </Link>
            {/* Negative margin cancels the badge's padding so the tag stays one text line tall. */}
            <span className="-my-0.5 inline-flex shrink-0">
                <Pill tooltip={VERIFIED_COLLECTION_TOOLTIP} variant="success">
                    Verified
                </Pill>
            </span>
        </span>
    );
}

const collectionLinkVariants = cva('min-w-0 truncate', {
    variants: { named: { false: 'font-mono', true: '' } },
});

function shortAddress(address: string) {
    return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function MutabilityHint({ mutable }: { mutable: boolean }) {
    return <Hint text={mutabilityTooltip(mutable)}>{mutable ? 'Mutable' : 'Immutable'}</Hint>;
}

function Hint({ text, children }: { text: string; children: ReactNode }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="cursor-help underline decoration-outer-space-500 decoration-dotted underline-offset-4">
                    {children}
                </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-64">{text}</TooltipContent>
        </Tooltip>
    );
}

export function NftCreatorsList({ creators }: { creators: NftHeaderModel['creators'] }) {
    if (!creators || creators.length === 0) return <Muted />;

    return (
        <div className="flex min-w-0 flex-col gap-y-1">
            {creators.map(creator => (
                <div key={creator.address} className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
                    <div className="min-w-0">
                        <Address pubkey={new PublicKey(creator.address)} link />
                    </div>
                    <CreatorShare creator={creator} />
                </div>
            ))}
        </div>
    );
}

function CreatorShare({ creator }: { creator: NftCreator }) {
    return (
        <span className="whitespace-nowrap text-left text-outer-space-300">
            {creator.share}%{!creator.verified && ' · unverified'}
        </span>
    );
}

function Muted() {
    return <span className="text-outer-space-300">—</span>;
}

const MUTABLE_TOOLTIP = "The update authority can still change this NFT's name, image and creators.";
const IMMUTABLE_TOOLTIP = "No one can change this NFT's name, image or creators.";

const VERIFIED_COLLECTION_TOOLTIP =
    'This NFT has been verified as a member of an on-chain collection. This tag guarantees authenticity.';
const COMPRESSED_TOOLTIP =
    'This NFT does not have a corresponding account, but uses verified ledger data to allow for transfers and trades. The existence of this tag ensures that the compressed NFT is verifiably up-to-date with the chain.';
function mutabilityTooltip(mutable: boolean) {
    return mutable ? MUTABLE_TOOLTIP : IMMUTABLE_TOOLTIP;
}
