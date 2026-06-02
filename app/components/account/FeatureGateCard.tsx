import { CardFooter } from '@/app/shared/ui/Card';

export function FeatureGateCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="card">
            <div className="card-header align-items-center">
                <h3 className="card-header-title">Feature Information</h3>
            </div>
            <CardFooter ui="dashkit" className="e-border-t-0">
                <div className="text-muted">{children}</div>
            </CardFooter>
        </div>
    );
}
