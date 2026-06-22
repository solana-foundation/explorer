// TODO(fsd): relocate this module to @shared or the appropriate feature/entity layer.
import { cn } from '../utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('animate-pulse rounded bg-heavy-metal-700 motion-reduce:animate-none', className)}
            {...props}
        />
    );
}

export { Skeleton };
