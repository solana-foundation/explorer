import { Tooltip, TooltipContent, TooltipTrigger } from '@components/shared/ui/tooltip';
import { Info } from 'react-feather';

function ScaledUiAmountMultiplierTooltip({
    rawAmount,
    scaledUiAmountMultiplier,
}: {
    rawAmount?: string;
    scaledUiAmountMultiplier: string;
}) {
    if (scaledUiAmountMultiplier === '1') {
        return null;
    }

    return (
        <Tooltip>
            <TooltipTrigger className="border-0 bg-transparent p-0">
                <Info color="white" size={13} className="ml-1.5" style={{ transform: 'translate(-2px, -1px)' }} />
            </TooltipTrigger>
            <TooltipContent>
                <div className="min-w-36 max-w-16">
                    Scaled {rawAmount ? `${rawAmount} ` : ''}by {scaledUiAmountMultiplier} due to the scaled ui amount
                    extension on the mint
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
export default ScaledUiAmountMultiplierTooltip;
