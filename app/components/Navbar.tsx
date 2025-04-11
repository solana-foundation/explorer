'use client';

import Logo from '@img/logos-solana/dark-explorer-logo.svg';
import { useDisclosure } from '@mantine/hooks';
import { useClusterPath } from '@utils/url';
import Image from 'next/image';
import Link from 'next/link';
import { useSelectedLayoutSegment, useSelectedLayoutSegments } from 'next/navigation';
import React, { ReactNode } from 'react';

import { ClusterStatusButton } from './ClusterStatusButton';

export interface INavbarProps {
    children?: ReactNode;
}

export function Navbar({ children }: INavbarProps) {
    const [navOpened, navHandlers] = useDisclosure(false);
    const homePath = useClusterPath({ pathname: '/' });
    const supplyPath = useClusterPath({ pathname: '/supply' });
    const inspectorPath = useClusterPath({ pathname: '/tx/inspector' });
    const selectedLayoutSegment = useSelectedLayoutSegment();
    const selectedLayoutSegments = useSelectedLayoutSegments();
    return (
        <nav className="navbar navbar-expand-lg navbar-light">
            <div className="container px-4">
                <Link href={homePath}>
                    <Image alt="Solana Explorer" height={22} src={Logo} width={214} />
                </Link>

                <button className="navbar-toggler" type="button" onClick={navHandlers.toggle}>
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="navbar-children d-flex align-items-center flex-grow-1 w-100 h-100 d-none d-lg-block">
                    {children}
                </div>

                <div className={`collapse navbar-collapse ms-auto ${navOpened ? 'show' : ''} flex-shrink-0`}>
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <Link
                                className={`nav-link${selectedLayoutSegment === null ? ' active' : ''}`}
                                href={homePath}
                            >
                                Cluster Stats
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link
                                className={`nav-link${selectedLayoutSegment === 'supply' ? ' active' : ''}`}
                                href={supplyPath}
                            >
                                Supply
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link
                                className={`nav-link${
                                    selectedLayoutSegments[0] === 'tx' && selectedLayoutSegments[1] === '(inspector)'
                                        ? ' active'
                                        : ''
                                }`}
                                href={inspectorPath}
                            >
                                Inspector
                            </Link>
                        </li>
                        <li className="nav-item align-items-center justify-content-center pt-2">
                            <a
                                aria-label="GitHub Repository"
                                href="https://github.com/solana-foundation/explorer"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mx-3"
                            >
                                <svg width="30" height="30" viewBox="0 0 98 98" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
                                        fill="#fff"
                                    />
                                </svg>
                            </a>
                        </li>
                    </ul>
                </div>

                <div className="d-none d-lg-block flex-shrink-0 ms-1">
                    <ClusterStatusButton />
                </div>
            </div>
        </nav>
    );
}
