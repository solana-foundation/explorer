'use client';

import * as PopoverPrimitive from '@radix-ui/react-popover';
import Link from 'next/link';
import { ChevronDown } from 'react-feather';

import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/shared/ui/popover';
import { cn } from '@/app/components/shared/utils';
import { useNavigationTabsContext } from '@/app/shared/ui/navigation-tabs/model/navigation-tabs-context';
import { type NavigationTab } from '@/app/shared/ui/navigation-tabs/model/types';

import { tabLinkClassName } from './TabLink';

type MobileMoreDropdownProps = {
    onSelectChange?: (path: string) => void;
    tabs: NavigationTab[];
};

export function MobileMoreDropdown({ tabs, onSelectChange }: MobileMoreDropdownProps) {
    const ctx = useNavigationTabsContext();
    const isActive = tabs.some(t => t.path === ctx.activeValue);

    return (
        <Popover>
            <div className="e-ml-auto e-flex e-items-center">
                <div className="e-mr-3 e-h-3/5 e-border-0 e-border-l e-border-solid e-border-neutral-700" />
                <PopoverTrigger
                    data-state={isActive ? 'active' : 'inactive'}
                    className={cn(tabLinkClassName, 'e-inline-flex e-cursor-pointer e-items-center e-gap-1')}
                >
                    More <ChevronDown size={12} />
                </PopoverTrigger>
            </div>
            <PopoverContent align="start" className="e-w-auto e-min-w-[8rem] e-p-1">
                {tabs.map(tab => (
                    <PopoverPrimitive.Close key={tab.path} asChild>
                        <Link
                            href={ctx.buildHref(tab.path)}
                            scroll={false}
                            onClick={() => onSelectChange?.(tab.path)}
                            data-state={tab.path === ctx.activeValue ? 'active' : 'inactive'}
                            className={cn(
                                'e-block e-rounded e-px-3 e-py-2',
                                'e-text-sm e-no-underline',
                                'e-text-outer-space-200 data-[state=active]:e-text-accent',
                                'hover:e-bg-outer-space-800 hover:e-text-white',
                            )}
                        >
                            {tab.title}
                        </Link>
                    </PopoverPrimitive.Close>
                ))}
            </PopoverContent>
        </Popover>
    );
}
