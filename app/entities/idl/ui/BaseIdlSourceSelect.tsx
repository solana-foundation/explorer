import { Button } from '@components/shared/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@components/shared/ui/dropdown-menu';
import { ChevronDown } from 'react-feather';

import { type IdlSelection } from '../model/custom-idl/types';
import { IdlVariant } from '../model/idl-variant';
import { type IdlSource } from '../model/sourced-idl';

export const IDL_SOURCE_LABELS: Record<IdlSource, string> = {
    [IdlVariant.Anchor]: 'Anchor',
    custom: 'Custom',
    [IdlVariant.ProgramMetadata]: 'PMP',
};

const SELECTIONS: readonly IdlSelection[] = ['custom', 'onChain'];

export function BaseIdlSourceSelect({
    selected,
    onChainSource,
    isOnChainLoading = false,
    customIdlName,
    onSelect,
    onReplace,
    onRemove,
}: {
    selected: IdlSelection;
    onChainSource: IdlVariant | undefined;
    isOnChainLoading?: boolean;
    customIdlName: string;
    onSelect: (selection: IdlSelection) => void;
    onReplace: () => void;
    onRemove: () => void;
}) {
    const source = selected === 'custom' ? 'custom' : onChainSource;
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    ui="dashkit"
                    variant={selected === 'custom' ? 'amber' : 'white'}
                    size="sm"
                    className="whitespace-nowrap"
                >
                    IDL: {source ? IDL_SOURCE_LABELS[source] : isOnChainLoading ? 'On-chain' : 'None'}
                    <ChevronDown className="ml-1.5" size={13} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
                <DropdownMenuRadioGroup
                    value={selected}
                    onValueChange={value => {
                        const selection = SELECTIONS.find(option => option === value);
                        if (selection) onSelect(selection);
                    }}
                >
                    <DropdownMenuRadioItem value="custom">
                        Custom
                        <span className="ml-2 truncate text-xs text-neutral-400">{customIdlName}</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="onChain" disabled={!onChainSource}>
                        On-chain
                        {onChainSource && (
                            <span className="ml-2 text-xs text-neutral-400">{IDL_SOURCE_LABELS[onChainSource]}</span>
                        )}
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onReplace}>Replace custom IDL…</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onSelect={onRemove}>
                    Remove custom IDL
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
