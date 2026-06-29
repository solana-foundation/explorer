// TODO(fsd): relocate this module to @shared or the appropriate feature/entity layer.
import type { AnchorHTMLAttributes, ReactNode } from 'react';

import { getSafeExternalHref } from '@/app/shared/lib/url';

export type ExternalLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'rel' | 'target'> & {
    /** Destination URL. Often attacker-controlled on-chain data, so it is scheme-checked. */
    href: string | undefined | null;
    children: ReactNode;
};

/**
 * Anchor to an external, third-party URL — the safe-by-default replacement for a
 * raw `<a>` whenever the destination is untrusted.
 *
 * It renders nothing unless `href` is an absolute http(s) URL: on-chain metadata
 * is attacker-controlled, so a `javascript:`/`data:` scheme must never reach the
 * DOM (`rel`/`target` don't stop a `javascript:` href from executing on click).
 * Every rendered link opens in a new tab with `rel="noopener noreferrer"`, and
 * those attributes are owned here — omitted from the props type — so no call
 * site can drop them.
 */
export function ExternalLink({ href, children, ...props }: ExternalLinkProps) {
    const safeHref = getSafeExternalHref(href);
    if (!safeHref) return undefined;

    return (
        <a {...props} href={safeHref} rel="noopener noreferrer" target="_blank">
            {children}
        </a>
    );
}
