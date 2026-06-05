import { CardFooter, CardHeader } from '@/app/shared/ui/Card';

export function FeatureGateCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="card">
            <CardHeader ui="dashkit">
                <h3 className="card-header-title">Feature Information</h3>
            </CardHeader>
            <CardFooter ui="dashkit" className="e-border-t-0">
                <div className="e-text-dk-gray-700">{children}</div>
            </CardFooter>
        </div>
    );
}
