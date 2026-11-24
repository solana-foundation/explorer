import { cva } from 'class-variance-authority';
import type { ReactNode } from 'react';

import { cn } from '@/app/components/shared/utils';
import { withStringsInsteadOfBigInts } from '@/app/shared/lib/bigint-to-string';
import { useCopyToClipboard } from '@/app/shared/lib/useCopyToClipboard';

import { InlineCopyButton } from './InlineCopyButton';

/**
 * JSON as an always-expanded tree: the `v2` body of `JsonViewer`. Each row's text doubles as its copy button —
 * hovering either highlights exactly the text it copies, and clicking either copies it. The corner button copies
 * the whole block; `blockCopy={false}` drops it for a host that copies the block from its own header.
 */
export function JsonView({ src, blockCopy = true }: { src: object; blockCopy?: boolean }) {
    return (
        <div className="min-w-0 font-mono text-sm leading-5">
            <JsonNode noun="JSON" value={withStringsInsteadOfBigInts(src)} copy={blockCopy ? 'corner' : 'none'} />
        </div>
    );
}

// `none`: the root row without its corner button.
type CopyPlacement = 'corner' | 'inline' | 'none';

// Text lights up (accent on faint accent bg) while the copy control that would copy it is hovered/focused.
// `copiedBy: node` = any enclosing node copies this text (values, brackets); `copiedBy: parent` = only a node
// above this row does (keys, string quotes). `[data-node]` marks every node but the root, so the corner button
// lights nothing.
const textVariants = cva('', {
    variants: {
        copiedBy: {
            node: '[[data-node]:has(>[data-row]>[data-copy]:focus-within)_&]:bg-dark-accent/10 [[data-node]:has(>[data-row]>[data-copy]:focus-within)_&]:text-dark-accent [[data-node]:has(>[data-row]>[data-copy]:hover)_&]:bg-dark-accent/10 [[data-node]:has(>[data-row]>[data-copy]:hover)_&]:text-dark-accent',
            parent: '[[data-node]:has(>[data-row]>[data-copy]:focus-within)_[data-node]_&]:bg-dark-accent/10 [[data-node]:has(>[data-row]>[data-copy]:focus-within)_[data-node]_&]:text-dark-accent [[data-node]:has(>[data-row]>[data-copy]:hover)_[data-node]_&]:bg-dark-accent/10 [[data-node]:has(>[data-row]>[data-copy]:hover)_[data-node]_&]:text-dark-accent',
        },
        tone: {
            key: 'text-outer-space-300',
            // Not accent green: green marks what a copy button copies.
            literal: 'text-blue-300',
            muted: 'text-outer-space-500',
            string: 'text-dark-foreground',
        },
    },
});

const rowVariants = cva('', {
    variants: {
        copy: {
            corner: 'flex items-start gap-2',
            // `relative`: anchors the row's indent overlay (see `Row`).
            inline: 'group/row relative break-all py-0.5',
            none: 'flex items-start gap-2',
        },
    },
});

const rowTextVariants = cva('', {
    variants: {
        copy: {
            corner: 'min-w-0 flex-1 break-all py-0.5',
            inline: 'cursor-pointer',
            none: 'min-w-0 flex-1 break-all py-0.5',
        },
    },
});

// Inline buttons appear on hover; touch screens have no hover, so there they stay visible.
const copyVariants = cva('', {
    variants: {
        copy: {
            corner: 'flex h-6 shrink-0 items-center',
            inline: 'ml-1.5 opacity-0 transition-opacity focus-within:opacity-100 [@media(hover:hover)]:group-hover/row:opacity-100 [@media(hover:none)]:opacity-100',
            none: '',
        },
    },
});

// `noun` names the row for the copy button's accessible label (the key, "item" in an array, or "JSON" at the root).
function JsonNode({
    name,
    noun,
    value,
    copy = 'inline',
    depth = 0,
}: {
    name?: string;
    noun: string;
    value: unknown;
    copy?: CopyPlacement;
    depth?: number;
}) {
    // A value that serialises itself (a web3.js `PublicKey`, a `Date`) is shown via its `toJSON`, as the copy gets it.
    if (hasToJson(value)) {
        return <JsonNode name={name} noun={noun} value={value.toJSON()} copy={copy} depth={depth} />;
    }

    if (value === null || typeof value !== 'object') {
        return (
            <div data-node={copy === 'inline' || undefined}>
                <Row
                    name={name}
                    noun={noun}
                    copy={copy}
                    depth={depth}
                    copyValue={typeof value === 'string' ? value : String(value)}
                >
                    <Primitive value={value} />
                </Row>
            </div>
        );
    }

    const isArray = Array.isArray(value);
    const entries: [string | undefined, unknown][] = isArray
        ? value.map(item => [undefined, item])
        : Object.entries(value);
    const [open, close] = isArray ? ['[', ']'] : ['{', '}'];
    const copyValue = JSON.stringify(value, undefined, 2);

    if (entries.length === 0) {
        return (
            <div data-node={copy === 'inline' || undefined}>
                <Row name={name} noun={noun} copy={copy} depth={depth} copyValue={copyValue}>
                    <span className={textVariants({ copiedBy: 'node', tone: 'muted' })}>{open + close}</span>
                </Row>
            </div>
        );
    }

    return (
        <div data-node={copy === 'inline' || undefined}>
            <Row name={name} noun={noun} copy={copy} depth={depth} copyValue={copyValue}>
                <span className={textVariants({ copiedBy: 'node', tone: 'muted' })}>{open}</span>
            </Row>
            <div className="pl-4">
                {entries.map(([key, item], index) => (
                    <JsonNode key={key ?? index} name={key} noun={key ?? 'item'} value={item} depth={depth + 1} />
                ))}
            </div>
            {copy === 'inline' ? (
                <Row noun={noun} copy="inline" depth={depth} copyValue={copyValue}>
                    <span className={textVariants({ copiedBy: 'node', tone: 'muted' })}>{close}</span>
                </Row>
            ) : (
                <div className="py-0.5">
                    <span className={textVariants({ copiedBy: 'node', tone: 'muted' })}>{close}</span>
                </div>
            )}
        </div>
    );
}

function Row({
    name,
    noun,
    copy,
    depth,
    copyValue,
    children,
}: {
    name?: string;
    noun: string;
    copy: CopyPlacement;
    depth: number;
    copyValue: string;
    children: ReactNode;
}) {
    const [copyState, copyToClipboard] = useCopyToClipboard(1000);
    const copyRow = () => copyToClipboard(copyValue);
    // Only nested rows' text copies on click; the root's brackets do not.
    const textCopies = copy === 'inline';
    return (
        <div data-row className={rowVariants({ copy })}>
            <span
                data-copy={textCopies || undefined}
                className={rowTextVariants({ copy })}
                onClick={
                    textCopies
                        ? () => {
                              // A drag that selects text is not a click on the row.
                              if (window.getSelection()?.toString()) return;
                              copyRow();
                          }
                        : undefined
                }
            >
                {/* Overlay across the row's indent so hovering/clicking the leading whitespace still acts on the row. */}
                {textCopies && depth > 0 && (
                    <span
                        aria-hidden
                        className={cn('absolute inset-y-0.5 right-full', textVariants({ copiedBy: 'parent' }))}
                        style={{ width: `${depth}rem` }}
                    />
                )}
                {name !== undefined && (
                    <>
                        <span className={textVariants({ copiedBy: 'parent', tone: 'key' })}>{name}</span>
                        <span className={textVariants({ copiedBy: 'parent', tone: 'muted' })}>: </span>
                    </>
                )}
                {children}
            </span>
            {copy !== 'none' && (
                <span data-copy className={copyVariants({ copy })}>
                    <InlineCopyButton noun={noun} state={copyState} onCopy={copyRow} />
                </span>
            )}
        </div>
    );
}

function Primitive({ value }: { value: unknown }) {
    if (typeof value === 'string') {
        // The quotes stay outside the value's own highlight: its row copies the bare string.
        const quote = <span className={textVariants({ copiedBy: 'parent', tone: 'string' })}>&quot;</span>;
        return (
            <>
                {quote}
                <span className={textVariants({ copiedBy: 'node', tone: 'string' })}>
                    {JSON.stringify(value).slice(1, -1)}
                </span>
                {quote}
            </>
        );
    }
    const tone = typeof value === 'number' || typeof value === 'boolean' ? 'literal' : 'muted';
    return <span className={textVariants({ copiedBy: 'node', tone })}>{String(value)}</span>;
}

function hasToJson(value: unknown): value is { toJSON: () => unknown } {
    return typeof value === 'object' && value !== null && typeof (value as { toJSON?: unknown }).toJSON === 'function';
}
