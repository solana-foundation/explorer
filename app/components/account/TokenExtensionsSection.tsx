export function TokenExtensionsSection() {
    return (
        <div className="table-responsive mb-0">
            <table className="table table-sm table-nowrap card-table">
                <thead>
                    <tr>
                        <th key={1} className="text-muted w-1">
                            Extension
                        </th>
                        <th key={2} className="text-muted w-1">
                            Status
                        </th>
                        <th key={3} className="text-muted">
                            Details
                        </th>
                    </tr>
                </thead>
                <tbody className="list">{/* content */}</tbody>
            </table>
        </div>
    );
}
