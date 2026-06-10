import { CopyableMonoText, StatusBar } from './StatusBar';

type TxSimulationStatusProps =
    | { status: 'success'; unitsConsumed: number | undefined; date: Date; link?: string }
    | { status: 'error'; message?: string; date: Date; link?: string };

export function TxSimulationStatus(props: TxSimulationStatusProps) {
    if (props.status === 'success') {
        return (
            <StatusBar
                message={
                    props.unitsConsumed !== undefined ? (
                        <ComputeUnitsBadge unitsConsumed={props.unitsConsumed} />
                    ) : undefined
                }
                date={props.date}
                theme="accent"
                badge={{ label: 'Simulated', variant: 'success' }}
                link={props.link}
            />
        );
    }
    return (
        <StatusBar
            message={props.message ? <CopyableMonoText text={props.message} theme="destructive" /> : undefined}
            date={props.date}
            theme="destructive"
            badge={{ label: 'Simulation Error', variant: 'destructive' }}
            link={props.link}
        />
    );
}

function ComputeUnitsBadge({ unitsConsumed }: { unitsConsumed: number }) {
    return (
        <div className="flex shrink-0 items-center gap-1">
            <span className="whitespace-nowrap text-xs tracking-tight text-accent-700">
                {unitsConsumed.toLocaleString('en-US')} CU
            </span>
        </div>
    );
}
