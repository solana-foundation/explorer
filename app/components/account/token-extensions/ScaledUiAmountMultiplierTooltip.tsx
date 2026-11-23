import { Tooltip, TooltipContent, TooltipTrigger } from '@components/shared/ui/tooltip';
import { type ScaledUiAmountMultiplier } from '@providers/accounts/tokens';
import { Info } from 'react-feather';

function ScaledUiAmountMultiplierTooltip({
    rawAmount,
    scaledUiAmountMultiplier,
}: {
    rawAmount?: string;
    scaledUiAmountMultiplier: ScaledUiAmountMultiplier;
}) {
    if (scaledUiAmountMultiplier.status === 'loading') {
        return null;
    }
    if (scaledUiAmountMultiplier.status === 'known' && scaledUiAmountMultiplier.multiplier === '1') {
        return null;
    }

    return (
        <Tooltip>
            <TooltipTrigger className="border-0 bg-transparent p-0">
                <Info color="white" size={13} className="ml-1.5" style={{ transform: 'translate(-2px, -1px)' }} />
            </TooltipTrigger>
            <TooltipContent>
                <div className="min-w-36 max-w-16">
                    {scaledUiAmountMultiplier.status === 'unknown'
                        ? 'The scaled ui amount multiplier is unknown'
                        : `Scaled ${rawAmount ? `${rawAmount} ` : ''}by ${scaledUiAmountMultiplier.multiplier} due to the scaled ui amount extension on the mint`}
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
export default ScaledUiAmountMultiplierTooltip;
