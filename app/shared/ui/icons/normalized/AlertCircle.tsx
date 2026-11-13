import { BASE_STROKE, NormalizedIcon } from './base';

interface NormalizedAlertCircleProps {
    className?: string;
    size?: number;
}

export function NormalizedAlertCircle({ className, size }: NormalizedAlertCircleProps) {
    return (
        <NormalizedIcon
            aria-hidden="true"
            className={className}
            size={size}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={BASE_STROKE}
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </NormalizedIcon>
    );
}
