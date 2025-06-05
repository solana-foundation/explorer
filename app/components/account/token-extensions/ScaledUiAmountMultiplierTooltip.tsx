import { Tooltip, TooltipContent, TooltipTrigger } from '@components/shared/ui/tooltip';
import { Info } from 'react-feather';

function ScaledUiAmountMultiplierTooltip({ scaledUiAmountMultiplier }: { scaledUiAmountMultiplier: number }) {
    if (scaledUiAmountMultiplier === 1) {
        return null;
    }

    return (
        <Tooltip>
            <TooltipTrigger className="e-border-0 e-bg-transparent e-p-0">
                <Info color="white" size={13} className="ms-2" />
            </TooltipTrigger>
            <TooltipContent>
                <div className="e-min-w-36 e-max-w-16">
                    Scaled by {scaledUiAmountMultiplier} due to the scaled ui amount extension on the mint
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
export default ScaledUiAmountMultiplierTooltip;
