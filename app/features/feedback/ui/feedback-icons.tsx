import { NormalizedIcon } from '@/app/shared/ui/icons/normalized/base';

export interface IconProps {
    className?: string;
    size?: number;
}

const STROKE = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
} as const;

export function GlowingBulbIcon({ className, size }: IconProps) {
    return (
        <NormalizedIcon aria-hidden className={className} size={size}>
            <g {...STROKE}>
                <path d="M9.8 18.5v-1.3c0-1.1-.8-2-2.12-2.8a5.2 5.2 0 1 1 8.64 0c-1.32.8-2.12 1.7-2.12 2.8v1.3z" />
                <path d="M10 21.5h4" />
                <path d="M12 1v1.5M4.79 4.29l.99.99M19.21 4.29l-.99.99" />
            </g>
        </NormalizedIcon>
    );
}

export function BugIcon({ className, size }: IconProps) {
    return (
        <NormalizedIcon aria-hidden className={className} size={size}>
            <g {...STROKE}>
                <path d="M9.8 7 8 3.5M14.2 7l1.8-3.5" />
                <rect height="14.5" rx="5.5" width="11" x="6.5" y="6.5" />
                <path d="M6.5 12.5H3m14.5 0H21M6.5 17H3m14.5 0H21" />
            </g>
        </NormalizedIcon>
    );
}
