import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { type AddressTabPath } from '@/app/address/[address]/layout';
import { ParsedTokenExtension } from '@/app/components/account/types';
import { TokenExtension } from '@/app/validators/accounts/token-extension';

const TOKEN_EXTENSIONS: Extract<AddressTabPath, 'token-extensions'> = 'token-extensions';
const TOKEN_EXTENSIONS_COMPONENT = `/${TOKEN_EXTENSIONS}`;

function getHash() {
    const hash = globalThis.location.hash.replace('#', '');
    return hash;
}

function hasHash() {
    return getHash().length > 0;
}

function scrollToExtension(extensionName: string) {
    globalThis.document.getElementById(extensionName)?.scrollIntoView({ behavior: 'smooth' });
}

function isOnDesiredPage() {
    return globalThis.location.pathname.endsWith(TOKEN_EXTENSIONS_COMPONENT);
}

function populateUri(path: string, component: string, searchParams: URLSearchParams, hash: string) {
    // eslint-disable-next-line no-restricted-syntax -- remove slashes from URL component
    const sanitizeComponent = (component: string) => component.replace(/\//g, '');
    return `${path}/${sanitizeComponent(component)}?${searchParams.toString()}#${hash}`;
}

export function getAnchorId(extension?: Pick<TokenExtension, 'extension'> | Pick<ParsedTokenExtension, 'extension'>) {
    return extension ? `${extension.extension}` : undefined;
}

export function useTokenExtensionNavigation({ uriComponent }: { uriComponent: string }) {
    const [activeExtension, setActiveExtension] = useState<string | undefined>(undefined);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const navigateToExtension = (extensionName?: string) => {
        // Navigate to token-extensions page with hash

        // It is necessary to construct the URI with all the parameters possible
        // That's because badges with extensions are displayed at the root component and any tab might be active below
        if (!isOnDesiredPage() && extensionName) {
            router.push(populateUri(uriComponent, TOKEN_EXTENSIONS, searchParams, extensionName));
        }

        setActiveExtension(extensionName);
    };

    // Check URL hash on mount and hashchange
    useEffect(() => {
        const updateFromHash = () => {
            const hash = getHash();
            if (hasHash()) {
                setActiveExtension(hash);
            }
        };

        // Set initial state from URL
        updateFromHash();

        // Listen for hash changes
        globalThis.addEventListener('hashchange', updateFromHash);

        return () => {
            globalThis.removeEventListener('hashchange', updateFromHash);
        };
    }, [pathname]);

    useEffect(() => {
        const isOnExtensionPage = isOnDesiredPage();
        if (activeExtension && isOnExtensionPage) {
            scrollToExtension(activeExtension);
        }
    }, [activeExtension]);

    // Sync URL hash after React commits the state change, so Next.js router interception
    // cannot race against the state update (calling replaceState inline in the event handler
    // triggers Next.js navigation processing before setActiveExtension can take effect).
    const skipFirstUrlSync = useRef(true);
    useEffect(() => {
        if (skipFirstUrlSync.current) {
            skipFirstUrlSync.current = false;
            return;
        }
        if (!isOnDesiredPage()) return;
        const base = `${globalThis.location.pathname}${globalThis.location.search}`;
        const url = activeExtension ? `${base}#${activeExtension}` : base;
        // eslint-disable-next-line unicorn/no-null -- history.replaceState expects null as the no-state sentinel per HTML spec
        globalThis.history.replaceState(null, '', url);
    }, [activeExtension]);

    return {
        activeExtension,
        navigateToExtension,
    };
}
