import { AlertCircle } from 'react-feather';

import { cn } from '@/app/components/shared/utils';

interface WarningNoteProps {
    label: string;
    className?: string;
}

export function WarningNote({ label, className }: WarningNoteProps) {
    return (
        <div className={cn('flex items-center gap-1.5 rounded', className)}>
            <AlertCircle className="text-destructive" size={14} />
            <div className="mt-0.5 text-xs tracking-tight text-destructive">{label}</div>
        </div>
    );
}
