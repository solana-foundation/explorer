'use client';

import { cn } from '@components/shared/utils';
import { ClusterDropdown } from '@features/cluster-switcher';
import React, { type ReactNode, useRef, useState } from 'react';

import { NavLinks, NavMenu } from './navbar/NavGroup';
import { NavSearch } from './navbar/NavSearch';
import { BAR_CLASSES, BrandLockup, GUTTER_CLASSES, useNavRoutes } from './navbar/shared';

export interface INavbarProps {
    children?: ReactNode;
}

export function Navbar({ children }: INavbarProps) {
    const [searchOpened, setSearchOpened] = useState(false);
    const [clusterOpened, setClusterOpened] = useState(false);
    const [menuOpened, setMenuOpened] = useState(false);
    const routes = useNavRoutes();
    const slotRef = useRef<HTMLSpanElement>(null);

    const onSearchOpenChange = (open: boolean) => {
        if (open) {
            setMenuOpened(false);
            setClusterOpened(false);
        }
        setSearchOpened(open);
    };
    const onClusterOpenChange = (open: boolean) => {
        if (open) {
            setMenuOpened(false);
            setSearchOpened(false);
        }
        setClusterOpened(open);
    };
    const onMenuOpenChange = (open: boolean) => {
        if (open) {
            setClusterOpened(false);
            setSearchOpened(false);
        }
        setMenuOpened(open);
    };

    return (
        <nav className={cn('py-3', BAR_CLASSES)}>
            <div
                className={cn(
                    'relative flex items-center gap-1.5 xs:gap-2',
                    'lg:grid lg:grid-cols-[minmax(112px,1fr)_minmax(0,720px)_1fr] lg:gap-4',
                    GUTTER_CLASSES,
                )}
            >
                <BrandLockup />

                <div className="contents lg:flex lg:min-w-0 lg:items-center lg:gap-2">
                    <NavSearch
                        open={searchOpened}
                        onOpenChange={onSearchOpenChange}
                        dockClassName="sm:ml-auto sm:max-w-[720px] lg:ml-0 lg:max-w-none"
                        restClassName="left-[calc(100%-184px)] right-[146px] xs:left-[calc(100%-239px)] xs:right-[201px]"
                        slotRef={slotRef}
                    >
                        {children}
                    </NavSearch>

                    <div className="ml-auto flex shrink-0 items-center gap-1.5 xs:gap-2 sm:ml-0">
                        <span ref={slotRef} aria-hidden className="block h-[38px] w-[38px] sm:hidden" />
                        <ClusterDropdown
                            align="end"
                            open={clusterOpened}
                            onOpenChange={onClusterOpenChange}
                            className="w-[80px] xs:w-[131px] sm:w-[142px] md:w-[170px]"
                        />
                    </div>
                </div>

                <NavLinks routes={routes} className="hidden lg:flex lg:justify-self-end" />
                <NavMenu
                    routes={routes}
                    filled
                    open={menuOpened}
                    onOpenChange={onMenuOpenChange}
                    className="lg:hidden"
                />
            </div>
        </nav>
    );
}
