import { Address } from '@components/common/Address';
import { BorshEventCoder, BorshInstructionCoder, Idl, Instruction, Program } from '@coral-xyz/anchor';
import { IdlEvent, IdlField, IdlInstruction, IdlTypeDefTyStruct } from '@coral-xyz/anchor/dist/cjs/idl';
import { useTransactionDetails } from '@providers/transactions';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import {
    decodeEventWithCustomDiscriminator,
    decodeInstructionWithCustomDiscriminator,
    FlattenedIdlAccount,
    getAnchorAccountsFromInstruction,
    getAnchorNameForInstruction,
    getAnchorProgramName,
    instructionIsSelfCPI,
    mapIxArgsToRows,
} from '@utils/anchor';
import { camelToTitleCase } from '@utils/index';
import { extractEventsFromLogs } from '@utils/program-logs';
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, CornerDownRight } from 'react-feather';

import { InstructionCard } from './InstructionCard';
import { ProgramEventsCard } from './ProgramEventsCard';

export default function AnchorDetailsCard(props: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    signature: string;
    innerCards?: JSX.Element[];
    childIndex?: number;
    anchorProgram: Program<Idl>;
}) {
    const { ix, anchorProgram, signature, index } = props;
    const programName = getAnchorProgramName(anchorProgram) ?? 'Unknown Program';

    const ixName = getAnchorNameForInstruction(ix, anchorProgram) ?? 'Unknown Instruction';
    const cardTitle = `${camelToTitleCase(programName)}: ${camelToTitleCase(ixName)}`;

    // Extract events from transaction logs
    const details = useTransactionDetails(signature);
    const eventCards = useMemo(() => {
        const transactionWithMeta = details?.data?.transactionWithMeta;
        if (!transactionWithMeta) return undefined;

        const logMessages = transactionWithMeta.meta?.logMessages;
        if (!logMessages) return undefined;

        // Extract event data for this specific instruction
        const eventDataList = extractEventsFromLogs(logMessages, index);
        if (eventDataList.length === 0) return undefined;

        // Create event cards
        return [
            <ProgramEventsCard
                key="events"
                eventDataList={eventDataList}
                program={anchorProgram}
                instructionIndex={index}
            />,
        ];
    }, [details, index, anchorProgram]);

    return (
        <InstructionCard title={cardTitle} {...props} eventCards={eventCards}>
            <AnchorDetails ix={ix} anchorProgram={anchorProgram} />
        </InstructionCard>
    );
}

function AnchorDetails({ ix, anchorProgram }: { ix: TransactionInstruction; anchorProgram: Program }) {
    const { ixAccounts, decodedIxData, ixDef } = useMemo(() => {
        let ixAccounts: FlattenedIdlAccount[] | null = null;
        let decodedIxData: Instruction | null = null;
        let ixDef: IdlInstruction | undefined;
        if (anchorProgram) {
            let coder: BorshInstructionCoder | BorshEventCoder;
            if (instructionIsSelfCPI(ix.data)) {
                // Try custom discriminator decoder first (handles variable-length discriminators)
                decodedIxData = decodeEventWithCustomDiscriminator(ix.data.slice(8).toString('base64'), anchorProgram);

                // Fallback to standard Anchor event decoder
                if (!decodedIxData) {
                    coder = new BorshEventCoder(anchorProgram.idl);
                    decodedIxData = coder.decode(ix.data.slice(8).toString('base64'));
                }
                const ixEventDef = anchorProgram.idl.events?.find(
                    ixDef => ixDef.name === decodedIxData?.name
                ) as IdlEvent;

                const ixEventFields = anchorProgram.idl.types?.find((type: any) => type.name === ixEventDef.name);

                // Remap the event definition to an instruction definition by force casting to struct fields
                ixDef = {
                    ...ixEventDef,
                    accounts: [],
                    args: ((ixEventFields?.type as IdlTypeDefTyStruct).fields as IdlField[]) ?? [],
                };

                // Self-CPI instructions have 1 account called the eventAuthority
                // https://github.com/coral-xyz/anchor/blob/04985802587c693091f836e0083e4412148c0ca6/lang/attribute/event/src/lib.rs#L165
                ixAccounts = [{ isMut: false, isSigner: true, name: 'eventAuthority' }];
            } else {
                // Try custom discriminator decoder first (handles variable-length discriminators)
                decodedIxData = decodeInstructionWithCustomDiscriminator(ix.data, anchorProgram);

                // Fallback to standard Anchor decoder
                if (!decodedIxData) {
                    coder = new BorshInstructionCoder(anchorProgram.idl);
                    decodedIxData = coder.decode(ix.data);
                }

                if (decodedIxData) {
                    ixDef = anchorProgram.idl.instructions.find(ixDef => ixDef.name === decodedIxData?.name);
                    if (ixDef) {
                        ixAccounts = getAnchorAccountsFromInstruction(decodedIxData, anchorProgram);
                    }
                }
            }
        }

        return {
            decodedIxData,
            ixAccounts,
            ixDef,
        };
    }, [anchorProgram, ix.data]);

    // Initialize collapsed groups with all group headers collapsed by default
    // Must be called before early return to satisfy React Hooks rules
    const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(() => {
        const groupIndices = new Set<number>();
        if (ixAccounts) {
            ixAccounts.forEach((account, index) => {
                if (account.isGroupHeader) {
                    groupIndices.add(index);
                }
            });
        }
        return groupIndices;
    });

    if (!ixAccounts || !decodedIxData || !ixDef) {
        return (
            <tr>
                <td colSpan={3} className="text-lg-center">
                    Failed to decode account data according to the public Anchor interface
                </td>
            </tr>
        );
    }

    const programName = getAnchorProgramName(anchorProgram) ?? 'Unknown Program';

    const toggleGroup = (groupIndex: number) => {
        setCollapsedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupIndex)) {
                newSet.delete(groupIndex);
            } else {
                newSet.add(groupIndex);
            }
            return newSet;
        });
    };

    return (
        <>
            <tr>
                <td>Program</td>
                <td className="text-lg-end" colSpan={2}>
                    <Address pubkey={ix.programId} alignRight link raw overrideText={programName} />
                </td>
            </tr>
            <tr className="table-sep">
                <td>Account Name</td>
                <td className="text-lg-end" colSpan={2}>
                    Address
                </td>
            </tr>
            {(() => {
                const rows: JSX.Element[] = [];
                let skipUntilLevel: number | null = null;
                let accountInfoIndex = 0; // Track position in ixAccounts array

                // First, insert group headers and track actual account indices
                const accountMap = new Map<number, number>(); // keyIndex -> ixAccountsIndex
                let actualAccountCount = 0;

                if (ixAccounts) {
                    for (let i = 0; i < ixAccounts.length; i++) {
                        if (ixAccounts[i].isGroupHeader) {
                            // Group headers don't consume an actual account slot
                            continue;
                        }
                        accountMap.set(actualAccountCount, i);
                        actualAccountCount++;
                    }
                }

                // Render group headers and accounts
                ix.keys.forEach(({ pubkey, isSigner, isWritable }, keyIndex) => {
                    // Check if there are group headers to render before this account
                    if (ixAccounts) {
                        while (accountInfoIndex < ixAccounts.length) {
                            const currentInfo = ixAccounts[accountInfoIndex];

                            if (currentInfo.isGroupHeader) {
                                // Render group header
                                const groupHeaderIndex = accountInfoIndex;
                                const isExpanded = !collapsedGroups.has(groupHeaderIndex);
                                skipUntilLevel = isExpanded ? null : currentInfo.nestingLevel ?? 0;

                                rows.push(
                                    <tr key={`group-${groupHeaderIndex}`} className="table-group-header">
                                        <td colSpan={2}>{camelToTitleCase(currentInfo.name)}</td>
                                        <td className="text-lg-end" onClick={() => toggleGroup(groupHeaderIndex)}>
                                            <div className="c-pointer">
                                                {isExpanded ? (
                                                    <>
                                                        <span className="text-info me-2">Collapse</span>
                                                        <ChevronUp size={15} />
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-info me-2">Expand</span>
                                                        <ChevronDown size={15} />
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                                accountInfoIndex++;
                            } else {
                                // This is an actual account, break to process it
                                break;
                            }
                        }
                    }

                    // Get the account info for this actual account
                    const accountInfo =
                        accountMap.has(keyIndex) && ixAccounts ? ixAccounts[accountMap.get(keyIndex)!] : null;

                    // Skip nested accounts if parent group is collapsed
                    if (
                        skipUntilLevel !== null &&
                        accountInfo?.nestingLevel !== undefined &&
                        accountInfo.nestingLevel > skipUntilLevel
                    ) {
                        accountInfoIndex++;
                        return;
                    }

                    // Reset skip flag when we exit the collapsed group
                    if (
                        skipUntilLevel !== null &&
                        accountInfo?.nestingLevel !== undefined &&
                        accountInfo.nestingLevel <= skipUntilLevel
                    ) {
                        skipUntilLevel = null;
                    }

                    rows.push(
                        <tr key={keyIndex} className={accountInfo?.isNested ? 'table-nested-account' : ''}>
                            <td>
                                <div className="d-flex flex-row align-items-center">
                                    {accountInfo?.isNested && <CornerDownRight className="me-2 mb-1" size={14} />}
                                    <div className="me-2 d-md-inline">
                                        {accountInfo
                                            ? `${camelToTitleCase(accountInfo.name)}`
                                            : ixAccounts
                                            ? `Remaining Account #${keyIndex + 1 - actualAccountCount}`
                                            : `Account #${keyIndex + 1}`}
                                    </div>
                                    {isWritable && <span className="badge bg-danger-soft me-1">Writable</span>}
                                    {isSigner && <span className="badge bg-info-soft me-1">Signer</span>}
                                </div>
                            </td>
                            <td className="text-lg-end" colSpan={2}>
                                <Address pubkey={pubkey} alignRight link />
                            </td>
                        </tr>
                    );

                    accountInfoIndex++;
                });

                return rows;
            })()}

            {decodedIxData && ixDef && ixDef.args.length > 0 && (
                <>
                    <tr className="table-sep">
                        <td>Argument Name</td>
                        <td>Type</td>
                        <td className="text-lg-end">Value</td>
                    </tr>
                    {mapIxArgsToRows(decodedIxData.data, ixDef, anchorProgram.idl)}
                </>
            )}
        </>
    );
}
