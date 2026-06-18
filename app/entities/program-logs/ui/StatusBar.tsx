import { cva } from 'class-variance-authority';
import { ReactNode } from 'react';
import { ExternalLink } from 'react-feather';

import { Copyable } from '@/app/components/common/Copyable';
import { Badge } from '@/app/components/shared/ui/badge';
import { cn } from '@/app/components/shared/utils';

import { formatLogTimestamp } from '../model/formatLogTimestamp';

export type StatusTheme = 'accent' | 'destructive';

const themedColor = {
    accent: 'text-accent-700',
    destructive: 'text-destructive',
} as const;

const timestampVariants = cva('whitespace-nowrap text-xs tracking-tight', {
    variants: { theme: themedColor },
});

const monoTextVariants = cva('overflow-hidden text-ellipsis whitespace-nowrap font-mono text-sm tracking-tight', {
    variants: { theme: themedColor },
});

type StatusBarProps = {
    message?: ReactNode;
    date: Date;
    theme: StatusTheme;
    badge: { label: string; variant: 'success' | 'destructive' };
    link: string | undefined;
};

export function StatusBar({ message, date, theme, badge, link }: StatusBarProps) {
    const badgeNode = (
        <Badge variant={badge.variant} size="xs" className={cn(!link && 'ml-auto')}>
            {badge.label}
            {Boolean(link) && (
                <>
                    {' '}
                    <ExternalLink size={12} />
                </>
            )}
        </Badge>
    );
    return (
        <div className="flex items-center gap-2 rounded border border-solid border-neutral-600 px-4 py-2">
            {message}
            <div className="flex items-center">
                <span className={timestampVariants({ theme })}>{formatLogTimestamp(date)}</span>
            </div>
            {link ? (
                <a href={link} target="_blank" rel="noopener noreferrer" className="ml-auto">
                    {badgeNode}
                </a>
            ) : (
                badgeNode
            )}
        </div>
    );
}

export function CopyableMonoText({ text, theme }: { text: string; theme: StatusTheme }) {
    return (
        <div className="flex w-1/2 min-w-0 items-center gap-1">
            <Copyable text={text}>
                <span className={monoTextVariants({ theme })}>{text}</span>
            </Copyable>
        </div>
    );
}
