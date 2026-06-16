'use client';

import Logo from '@img/logos-solana/dark-explorer-logo.svg';
import { useDisclosure } from '@mantine/hooks';
import { cn } from '@shared/utils';
import { useClusterPath } from '@utils/url';
import Image from 'next/image';
import Link from 'next/link';
import { useSelectedLayoutSegment, useSelectedLayoutSegments } from 'next/navigation';
import React, { ReactNode } from 'react';
import { Menu } from 'react-feather';

import { NavbarItem, NavbarLink, NavbarList } from '@/app/shared/ui/Navbar';

import { ClusterStatusButton } from './ClusterStatusButton';

export interface INavbarProps {
    children?: ReactNode;
}

export function Navbar({ children }: INavbarProps) {
    const [navOpened, navHandlers] = useDisclosure(false);
    const homePath = useClusterPath({ pathname: '/' });
    const featureGatesPath = useClusterPath({ pathname: '/feature-gates' });
    const inspectorPath = useClusterPath({ pathname: '/tx/inspector' });
    const selectedLayoutSegment = useSelectedLayoutSegment();
    const selectedLayoutSegments = useSelectedLayoutSegments();

    return (
        <nav className="e-flex e-flex-wrap e-items-center e-bg-dk-gray-800-dark e-py-3 e-text-dk-white">
            <div
                // Per-breakpoint max-widths mirror Bootstrap `.container` (sm 540 / md 720 / lg 960 / xl 1140 / xxl 1320) so logo + links land in the same gutter as before the shell migration.
                className="e-mx-auto e-flex e-w-full e-flex-wrap e-items-center e-justify-between e-px-6 sm:e-max-w-[540px] md:e-max-w-[720px] lg:e-max-w-[960px] xl:e-max-w-[1140px] xxl:e-max-w-[1320px]"
            >
                <Link href={homePath}>
                    <Image alt="Solana Explorer" height={22} src={Logo} width={214} priority />
                </Link>

                <button
                    type="button"
                    aria-label="Toggle navigation"
                    onClick={navHandlers.toggle}
                    className="e-rounded-dk e-border e-border-solid e-border-transparent e-bg-transparent e-px-0 e-py-1 e-text-dk-gray-700 lg:e-hidden"
                >
                    <Menu size={24} aria-hidden />
                </button>

                <div
                    className="e-flex e-hidden e-h-full e-grow e-items-center e-pl-6 e-pr-2 xl:e-block"
                    style={{ minWidth: 0 }}
                >
                    {children}
                </div>

                <div
                    className={cn(
                        'e-ml-auto e-shrink-0',
                        navOpened
                            ? 'e-flex e-w-full e-flex-col'
                            : 'e-hidden lg:e-flex lg:e-w-auto lg:e-flex-row lg:e-items-center',
                    )}
                >
                    <NavbarList className="e-mr-auto e-flex-col lg:e-flex-row">
                        <NavbarItem>
                            <NavbarLink asChild active={selectedLayoutSegment === 'feature-gates'}>
                                <Link href={featureGatesPath}>Feature Gates</Link>
                            </NavbarLink>
                        </NavbarItem>
                        <NavbarItem>
                            <NavbarLink
                                asChild
                                active={
                                    selectedLayoutSegments[0] === 'tx' && selectedLayoutSegments[1] === '(inspector)'
                                }
                            >
                                <Link href={inspectorPath}>Inspector</Link>
                            </NavbarLink>
                        </NavbarItem>
                        <NavbarItem className="e-flex e-items-center e-justify-center">
                            <a
                                aria-label="GitHub Repository"
                                href="https://github.com/solana-foundation/explorer"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="e-mx-3"
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
                        </NavbarItem>
                    </NavbarList>
                </div>

                <div className="e-ml-[3px] e-hidden e-shrink-0 lg:e-block">
                    <ClusterStatusButton />
                </div>
            </div>
        </nav>
    );
}
