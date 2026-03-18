'use client';

import Logo from '@img/logos-solana/dark-explorer-logo.svg';
import { useClusterPath } from '@utils/url';
import Image from 'next/image';
import Link from 'next/link';
import { useSelectedLayoutSegment, useSelectedLayoutSegments } from 'next/navigation';

export function Footer() {
    const homePath = useClusterPath({ pathname: '/' });
    const featureGatesPath = useClusterPath({ pathname: '/feature-gates' });
    const supplyPath = useClusterPath({ pathname: '/supply' });
    const programsPath = useClusterPath({ pathname: '/verified-programs' });
    const tosPath = useClusterPath({ pathname: '/tos' });
    const inspectorPath = useClusterPath({ pathname: '/tx/inspector' });
    const selectedLayoutSegment = useSelectedLayoutSegment();
    const selectedLayoutSegments = useSelectedLayoutSegments();

    const isInspectorActive = selectedLayoutSegments[0] === 'tx' && selectedLayoutSegments[1] === '(inspector)';

    const linkClass = (active: boolean) =>
        `e-text-sm e-transition-colors ${active ? 'e-text-white' : 'e-text-neutral-400 hover:e-text-white'}`;

    return (
        <footer className="e-mt-4 e-border-0 e-border-t e-border-solid e-border-neutral-800 e-py-6">
            <div className="container">
                <div className="e-flex e-flex-col e-items-center e-gap-3 md:e-flex-row md:e-justify-between md:e-gap-6">
                    <Link href={homePath}>
                        <Image alt="Solana Explorer" height={22} src={Logo} width={214} />
                    </Link>
                    <nav className="e-flex e-flex-col e-flex-wrap e-items-center e-gap-x-5 e-gap-y-3 md:e-flex-row">
                        <Link className={linkClass(selectedLayoutSegment === 'feature-gates')} href={featureGatesPath}>
                            Feature Gates
                        </Link>
                        <Link className={linkClass(selectedLayoutSegment === 'supply')} href={supplyPath}>
                            Supply
                        </Link>
                        <Link className={linkClass(selectedLayoutSegment === 'verified-programs')} href={programsPath}>
                            Programs
                        </Link>
                        <Link className={linkClass(isInspectorActive)} href={inspectorPath}>
                            Inspector
                        </Link>
                        <Link className={linkClass(selectedLayoutSegment === 'tos')} href={tosPath}>
                            ToS
                        </Link>
                        <a
                            href="https://github.com/solana-foundation/explorer"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="e-text-sm e-text-neutral-400 e-transition-colors hover:e-text-white"
                        >
                            GitHub
                        </a>
                    </nav>
                </div>
            </div>
        </footer>
    );
}
