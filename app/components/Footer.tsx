'use client';

import { useClusterPath } from '@utils/url';
import Link from 'next/link';

export function Footer() {
    const tosPath = useClusterPath({ pathname: '/tos' });
    const cookiesPath = useClusterPath({ pathname: '/cookies' });

    return (
        <footer className="e-border-0 e-border-t e-border-solid e-border-neutral-800">
            <div className="container">
                <div className="e-flex e-flex-col e-gap-3 e-py-3 md:e-flex-row md:e-items-center md:e-justify-between md:e-py-5">
                    <span className="e-text-xs e-font-medium e-uppercase e-tracking-[0.72px] e-text-heavy-metal-400">
                        Solana explorer <span>(Beta)</span>
                    </span>
                    <nav className="e-flex e-items-center e-gap-5 e-text-xs e-tracking-[-0.24px] e-text-accent-700">
                        <Link className="e-transition-colors hover:e-text-accent-500" href={tosPath}>
                            Terms of Services
                        </Link>
                        <Link className="e-transition-colors hover:e-text-accent-500" href={cookiesPath}>
                            Cookies policy
                        </Link>
                    </nav>
                </div>
            </div>
        </footer>
    );
}
