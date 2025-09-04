import { ProgramCpiCallsView } from './ui/ProgramCpiCallsView';

export function ProgramCpiCalls({ address }: { address: string }) {
    return <ProgramCpiCallsView address={address} />;
}
