import { cn } from '../utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('e-animate-pulse e-rounded e-bg-heavy-metal-700 motion-reduce:e-animate-none', className)}
            {...props}
        />
    );
}

export { Skeleton };
