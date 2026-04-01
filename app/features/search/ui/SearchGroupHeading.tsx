export function SearchGroupHeading({ label }: { label: string }) {
    return (
        <div className="e-px-3 e-pb-1 e-pt-3">
            <span className="e-shrink-0 e-select-none e-text-xs e-font-semibold e-uppercase e-tracking-widest e-text-heavy-metal-400">
                {label}
            </span>
        </div>
    );
}
