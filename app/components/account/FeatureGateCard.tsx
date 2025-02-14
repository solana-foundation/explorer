export function FeatureGateCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="card">
            <div className="card-header align-items-center">
                <h3 className="card-header-title">Feature Information</h3>
            </div>
            <div className="card-footer">{children}</div>
        </div>
    );
}
