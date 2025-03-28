import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/shared/ui/accordion";

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
    );
}
