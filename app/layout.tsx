import './scss/theme-dark.scss';
import './styles.css';

import { ClusterModal } from '@components/ClusterModal';
import { ClusterStatusButton } from '@components/ClusterStatusButton';
import { CookieConsent } from '@components/common/CookieConsent';
import { MessageBanner } from '@components/MessageBanner';
import { Navbar } from '@components/Navbar';
import { ClusterProvider } from '@providers/cluster';
import { ScrollAnchorProvider } from '@providers/scroll-anchor';
import { Toaster } from '@shared/ui/sonner/toaster';
import { isEnvEnabled } from '@utils/env';
import { BotIdClient } from 'botid/client';
import type { Viewport } from 'next';
import dynamic from 'next/dynamic';
import { Rubik } from 'next/font/google';
import { Metadata } from 'next/types';

import { getIsEU } from '@/app/utils/geo-location';

import { botIdProtectedRoutes } from '../middleware';

const SearchBar = dynamic(() => import('@components/SearchBar'), {
    ssr: false,
});

export const metadata: Metadata = {
    description: 'Inspect transactions, accounts, blocks, and more on the Solana blockchain',
    manifest: '/manifest.json',
    title: 'Explorer | Solana',
};

export const viewport: Viewport = {
    initialScale: 1,
    maximumScale: 1,
    width: 'device-width',
};

const rubikFont = Rubik({
    display: 'swap',
    subsets: ['latin'],
    variable: '--explorer-default-font',
    weight: ['300', '400', '700'],
});

export default function RootLayout({ analytics, children }: { analytics: React.ReactNode; children: React.ReactNode }) {
    const isEU = getIsEU();

    return (
        <html lang="en" className={`${rubikFont.variable}`}>
            <head>
                <link rel="icon" href="/favicon.png" type="image/png" />
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <BotIdClient
                    protect={isEnvEnabled(process.env.NEXT_PUBLIC_BOTID_ENABLED) ? botIdProtectedRoutes : []}
                />
            </head>
            <body>
                <ScrollAnchorProvider>
                    <ClusterProvider>
                        <ClusterModal />
                        <div className="main-content pb-4">
                            <Navbar>
                                <SearchBar />
                            </Navbar>
                            <MessageBanner />
                            <div className="container my-3 d-xl-none">
                                <SearchBar />
                            </div>
                            <div className="container my-3 d-lg-none">
                                <ClusterStatusButton />
                            </div>
                            {children}
                        </div>
                        <Toaster position="bottom-center" toastOptions={{ duration: 5_000 }} />
                    </ClusterProvider>
                </ScrollAnchorProvider>
                {analytics}
                <CookieConsent isEU={isEU} />
            </body>
        </html>
    );
}
