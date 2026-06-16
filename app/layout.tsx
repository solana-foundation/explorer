import './styles/styles.css';

import { ClusterModal } from '@components/ClusterModal';
import { ClusterStatusButton } from '@components/ClusterStatusButton';
import { Footer } from '@components/Footer';
import { MessageBanner } from '@components/MessageBanner';
import { Navbar } from '@components/Navbar';
import { ClusterProvider } from '@providers/cluster';
import { ScrollAnchorProvider } from '@providers/scroll-anchor';
import { Toaster } from '@shared/ui/sonner/toaster';
import { EXPLORER_BASE_URL, isEnvEnabled } from '@utils/env';
import { BotIdClient } from 'botid/client';
import type { Viewport } from 'next';
import { type Metadata } from 'next/types';
import { Suspense } from 'react';

import { SearchBar } from '@/app/components/SearchBarLoader';
import { TokenInfoBatchProvider } from '@/app/entities/token-info';
import { CookieConsent } from '@/app/features/cookie';
import { VisibilityProvider } from '@/app/shared/lib/visibility';
import { PageContainer } from '@/app/shared/ui/page-container/PageContainer';
import { rubikFont } from '@/app/styles';

import { botIdProtectedRoutes } from '../proxy';

export const metadata: Metadata = {
    description: 'Inspect transactions, accounts, blocks, and more on the Solana blockchain',
    manifest: '/manifest.json',
    metadataBase: new URL(EXPLORER_BASE_URL),
    title: 'Explorer | Solana',
};

export const viewport: Viewport = {
    initialScale: 1,
    maximumScale: 1,
    width: 'device-width',
};

export default function RootLayout({ analytics, children }: { analytics: React.ReactNode; children: React.ReactNode }) {
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
            {/* suppressHydrationWarning: browser extensions (e.g. wallet adapters, password managers) may inject attributes onto <body>, causing a mismatch */}
            <body suppressHydrationWarning>
                <Suspense fallback={null}>
                    <ScrollAnchorProvider>
                        <ClusterProvider>
                            <VisibilityProvider>
                                <TokenInfoBatchProvider>
                                    <ClusterModal />
                                    <div className="flex min-h-screen flex-col">
                                        <div className="min-w-[292px] flex-1 pb-6">
                                            <Navbar>
                                                <SearchBar />
                                            </Navbar>
                                            <MessageBanner />
                                            <PageContainer className="my-3 xl:hidden">
                                                <SearchBar />
                                            </PageContainer>
                                            <PageContainer className="my-3 lg:hidden">
                                                <ClusterStatusButton />
                                            </PageContainer>
                                            {children}
                                        </div>
                                        <Footer />
                                    </div>
                                    <Toaster position="bottom-center" toastOptions={{ duration: 5_000 }} />
                                </TokenInfoBatchProvider>
                            </VisibilityProvider>
                        </ClusterProvider>
                    </ScrollAnchorProvider>
                </Suspense>
                {analytics}
                <CookieConsent />
            </body>
        </html>
    );
}
