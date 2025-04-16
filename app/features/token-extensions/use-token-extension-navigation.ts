import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { type MoreTabs } from '@/app/address/[address]/layout';
import { ParsedTokenExtension } from '@/app/components/account/types';
import { TokenExtension } from '@/app/validators/accounts/token-extension';

// extract type for the tab to not loose the functionality of the token extension navigation
const TOKEN_EXTENSIONS: Extract<MoreTabs, 'token-extensions'> = 'token-extensions';
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
        } else {
            // Just update the hash if already on the page
            globalThis.location.hash = extensionName ?? '';
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

    return {
        activeExtension,
        navigateToExtension,
        setActiveExtension,
    };
}
