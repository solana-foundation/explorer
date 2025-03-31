import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/shared/ui/accordion";
import { Badge } from "@/app/components/shared/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/shared/ui/tooltip";

export function TokenExtensionsSection() {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-row items-center gap-4">
                <div className="flex flex-row items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger>
                            <Badge variant="secondary">
                                permanentDelegate
                                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[10px] text-white">
                                    ✓
                                </span>
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            Designates an address with unrestricted authority to transfer or burn tokens from any account associated with a specific mint, effectively granting global control over that token's supply.
                        </TooltipContent>
                    </Tooltip>
                </div>

                <div className="flex flex-row items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger>
                            <Badge variant="secondary">
                                transferFeeConfig
                                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[10px] text-white">
                                    ✓
                                </span>
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            Specifies the parameters for charging fees on token transfers, including the percentage fee (feeBasisPoints), the maximum fee (maxFee), and the authorities responsible for configuring these fees and withdrawing the collected amounts.
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>

            {/* Keep the original accordion for reference if needed */}
            <div className="hidden">
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
                        <tbody>
                            <tr>
                                <td colSpan={3}>
                                    <Accordion type="single" collapsible>
                                        <AccordionItem value="transfer-fee">
                                            <AccordionTrigger>Transfer Fee</AccordionTrigger>
                                            <AccordionContent>
                                                <div className="d-flex justify-content-between">
                                                    <span>Fee</span>
                                                    <span>1%</span>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <span>Maximum Fee</span>
                                                    <span>5000</span>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>

                                        <AccordionItem value="interest-bearing">
                                            <AccordionTrigger>Interest Bearing</AccordionTrigger>
                                            <AccordionContent>
                                                <div className="d-flex justify-content-between">
                                                    <span>Rate</span>
                                                    <span>5% APY</span>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>

                                        <AccordionItem value="non-transferable">
                                            <AccordionTrigger>Non Transferable</AccordionTrigger>
                                            <AccordionContent>
                                                <div>Token cannot be transferred between accounts</div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
