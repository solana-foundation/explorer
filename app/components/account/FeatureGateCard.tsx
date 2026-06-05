import { Card, CardFooter, CardHeader, CardTitle } from '@/app/shared/ui/Card';

export function FeatureGateCard({ children }: { children: React.ReactNode }) {
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    Feature Information
                </CardTitle>
            </CardHeader>
            <CardFooter ui="dashkit" className="e-border-t-0">
                <div className="e-text-dk-gray-700">{children}</div>
            </CardFooter>
        </Card>
    );
}
