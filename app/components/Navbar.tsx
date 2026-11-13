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
            {/* Under 329px the logo, three controls and 16px gutters don't fit, so both gutters drop to 8px. */}
            <div
                className={cn(
                    'relative flex items-center gap-1.5 xs:gap-2 [@media(max-width:328px)]:px-2',
                    'lg:grid lg:grid-cols-[minmax(max-content,1fr)_minmax(0,720px)_1fr] lg:gap-4',
                    GUTTER_CLASSES,
                )}
            >
                {/* The margin plus the row gap keeps the search at least 20px (sm), 32px (md) or 64px (lg) from the logo. */}
                <BrandLockup className="sm:mr-3 md:mr-6 lg:mr-12" />

                <div className="contents lg:flex lg:min-w-0 lg:items-center lg:gap-2">
                    <NavSearch
                        open={searchOpened}
                        onOpenChange={onSearchOpenChange}
                        dockClassName="sm:ml-auto sm:max-w-[720px] lg:ml-0 lg:max-w-none"
                        restClassName="left-[calc(100%-184px)] right-[146px] [@media(max-width:328px)]:left-[calc(100%-176px)] [@media(max-width:328px)]:right-[138px] xs:left-[calc(100%-228px)] xs:right-[190px]"
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
                            className="w-[80px] xs:w-[120px] sm:w-[142px] md:w-[170px]"
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
