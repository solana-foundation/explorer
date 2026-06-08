import { cva } from 'class-variance-authority';
import { ReactNode } from 'react';
import { ExternalLink } from 'react-feather';

import { Copyable } from '@/app/components/common/Copyable';
import { Badge } from '@/app/components/shared/ui/badge';
import { cn } from '@/app/components/shared/utils';

import { formatLogTimestamp } from '../model/formatLogTimestamp';

export type StatusTheme = 'accent' | 'destructive';

const themedColor = {
    accent: 'e-text-accent-700',
    destructive: 'e-text-destructive',
} as const;

const timestampVariants = cva('e-whitespace-nowrap e-text-xs e-tracking-tight', {
    variants: { theme: themedColor },
});

const monoTextVariants = cva(
    'e-overflow-hidden e-text-ellipsis e-whitespace-nowrap e-font-mono e-text-sm e-tracking-tight',
    { variants: { theme: themedColor } },
);

type StatusBarProps = {
    message?: ReactNode;
    date: Date;
    theme: StatusTheme;
    badge: { label: string; variant: 'success' | 'destructive' };
    link: string | undefined;
};

export function StatusBar({ message, date, theme, badge, link }: StatusBarProps) {
    const badgeNode = (
        <Badge variant={badge.variant} size="xs" className={cn(!link && 'e-ml-auto')}>
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
        <div className="e-flex e-items-center e-gap-2 e-rounded e-border e-border-solid e-border-neutral-600 e-px-4 e-py-2">
            {message}
            <div className="e-flex e-items-center">
                <span className={timestampVariants({ theme })}>{formatLogTimestamp(date)}</span>
            </div>
            {link ? (
                <a href={link} target="_blank" rel="noopener noreferrer" className="e-ml-auto">
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
        <div className="e-flex e-w-1/2 e-items-center e-gap-1">
            <Copyable text={text}>
                <span className={monoTextVariants({ theme })}>{text}</span>
            </Copyable>
        </div>
    );
}
