import { BaseTable } from '@shared/ui/Table';
import { cva } from 'class-variance-authority';
import { Children, isValidElement, type ReactNode } from 'react';
import ReactMarkdown, { type Components, defaultUrlTransform } from 'react-markdown';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGFM from 'remark-gfm';

/**
 * Renders a SIMD proposal's markdown with the design-system typography. `baseUrl` is the proposal's own
 * GitHub URL: relative links between proposals (`./0088-….md`) resolve against it instead of the explorer.
 */
export function FeatureGateMarkdown({ baseUrl, children }: { baseUrl?: string; children: string }) {
    // A base that is not an absolute URL would make `new URL(relative, base)` throw in resolveUrl; drop it,
    // so a relative link falls back to the explorer rather than being silently swallowed.
    const resolvedBase = baseUrl && URL.canParse(baseUrl) ? baseUrl : undefined;

    return (
        <div className="text-sm leading-normal text-outer-space-100 [overflow-wrap:anywhere] [&>:first-child]:mt-0 [&>:last-child]:mb-0">
            <ReactMarkdown
                components={markdownComponents()}
                remarkPlugins={[remarkGFM, remarkFrontmatter]}
                urlTransform={url => resolveUrl(url, resolvedBase)}
            >
                {children}
            </ReactMarkdown>
        </div>
    );
}

// Every element sets its own size and margins: the global element rules give bare tags the dashkit defaults,
// so leaving any unset would inherit those.
const headingVariants = cva('mb-3 mt-8 font-medium leading-[1.1] text-white', {
    variants: {
        level: {
            1: 'text-2xl',
            2: 'text-xl',
            3: 'text-lg',
            4: 'text-base',
            5: 'text-sm',
            6: 'text-xs uppercase tracking-[0.08em]',
        },
    },
});

// A nested `ul` switches the disc to a circle so each level reads apart; `li` sets the nested list's margins.
const listVariants = cva('mb-4 mt-0 pl-6 [&_ul]:list-[circle]', {
    variants: {
        type: {
            ordered: 'list-decimal',
            unordered: 'list-disc',
        },
    },
});

// Built per render so the heading slugger starts fresh for each proposal.
function markdownComponents(): Components {
    const slugFor = createHeadingSlugger();
    return {
        a: ({ children, href }) => <MarkdownLink href={href}>{children}</MarkdownLink>,
        blockquote: ({ children }) => (
            <blockquote className="mb-4 border-0 border-l-2 border-solid border-outer-space-700 pl-4 text-outer-space-300 [&>p:last-child]:mb-0">
                {children}
            </blockquote>
        ),
        code: ({ children }) => (
            <code className="rounded bg-outer-space-800 px-1 py-0.5 font-mono text-[0.875em] text-white">
                {children}
            </code>
        ),
        h1: ({ children }) => (
            <MarkdownHeading id={slugFor(children)} level={1}>
                {children}
            </MarkdownHeading>
        ),
        h2: ({ children }) => (
            <MarkdownHeading id={slugFor(children)} level={2}>
                {children}
            </MarkdownHeading>
        ),
        h3: ({ children }) => (
            <MarkdownHeading id={slugFor(children)} level={3}>
                {children}
            </MarkdownHeading>
        ),
        h4: ({ children }) => (
            <MarkdownHeading id={slugFor(children)} level={4}>
                {children}
            </MarkdownHeading>
        ),
        h5: ({ children }) => (
            <MarkdownHeading id={slugFor(children)} level={5}>
                {children}
            </MarkdownHeading>
        ),
        h6: ({ children }) => (
            <MarkdownHeading id={slugFor(children)} level={6}>
                {children}
            </MarkdownHeading>
        ),
        hr: () => <hr className="my-8 border-outer-space-800" />,
        li: ({ children }) => (
            <li className="mb-1 [&>ol]:mb-0 [&>ol]:mt-1 [&>p]:mb-2 [&>ul]:mb-0 [&>ul]:mt-1">{children}</li>
        ),
        ol: ({ children, start }) => (
            <ol start={start} className={listVariants({ type: 'ordered' })}>
                {children}
            </ol>
        ),
        p: ({ children }) => <p className="mb-4 mt-0">{children}</p>,
        // A code block keeps its lines and scrolls sideways inside its own box. The `[&_code]` overrides reset
        // the inline-code chip for the `<code>` that markdown nests inside every `<pre>`.
        pre: ({ children }) => (
            <pre className="mb-4 overflow-x-auto rounded-lg border border-solid border-outer-space-800 bg-outer-space-950 p-4 font-mono text-xs leading-normal text-white [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[length:inherit]">
                {children}
            </pre>
        ),
        // The wrapper scrolls a wide table inside the card. The cell floor stops the inherited
        // `overflow-wrap: anywhere` from squeezing columns to a character wide; past it the table scrolls.
        table: ({ children }) => (
            <div className="mb-4 overflow-x-auto rounded-lg border border-solid border-outer-space-800">
                <BaseTable density="dense" head="subtle" className="[&_td]:min-w-[8rem] [&_th]:min-w-[8rem]">
                    {children}
                </BaseTable>
            </div>
        ),
        ul: ({ children }) => <ul className={listVariants({ type: 'unordered' })}>{children}</ul>,
    };
}

// An in-page anchor (`#notes`) scrolls to a heading of the same proposal; every other link leaves the
// explorer, so it opens in a new tab. `urlTransform` empties an unsafe target (`javascript:`), and an
// empty `href` would reopen the explorer page itself, so that link keeps no target at all.
function MarkdownLink({ children, href }: { children: ReactNode; href?: string }) {
    const external = Boolean(href) && !href?.startsWith('#');

    return (
        <a
            href={href || undefined}
            className="text-dark-accent hover:text-dark-accent-hover"
            {...(external && { rel: 'noopener noreferrer', target: '_blank' })}
        >
            {children}
        </a>
    );
}

function MarkdownHeading({ children, id, level }: { children: ReactNode; id: string; level: 1 | 2 | 3 | 4 | 5 | 6 }) {
    const Tag = `h${level}` as const;

    return (
        <Tag id={id} className={headingVariants({ level })}>
            {children}
        </Tag>
    );
}

// The base is validated in FeatureGateMarkdown, so `new URL` never throws here.
function resolveUrl(url: string, baseUrl?: string) {
    const safeUrl = defaultUrlTransform(url);
    if (!baseUrl || !safeUrl || safeUrl.startsWith('#')) return safeUrl;

    return new URL(safeUrl, baseUrl).href;
}

// GitHub's anchor slugs, so the `#…` links a proposal carries land on its headings, with GitHub's `-1`, `-2`
// suffixes for a heading that repeats (e.g. "Example") so each anchor stays unique.
function createHeadingSlugger() {
    const counts = new Map<string, number>();
    return (children: ReactNode) => {
        const base = toSlug(textOf(children));
        const seen = counts.get(base) ?? 0;
        counts.set(base, seen + 1);
        return seen === 0 ? base : `${base}-${seen}`;
    };
}

function toSlug(text: string): string {
    return (
        text
            .trim()
            .toLowerCase()
            // eslint-disable-next-line no-restricted-syntax -- GitHub's slug drops every character but letters, digits, spaces, `_` and `-`
            .replace(/[^\p{L}\p{N} _-]/gu, '')
            .split(' ')
            .join('-')
    );
}

function textOf(node: ReactNode): string {
    return Children.toArray(node)
        .map(child => {
            if (typeof child === 'string' || typeof child === 'number') return String(child);
            if (isValidElement<{ children?: ReactNode }>(child)) return textOf(child.props.children);
            return '';
        })
        .join('');
}
