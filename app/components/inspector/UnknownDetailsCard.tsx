import { HexData } from '@components/common/HexData';
import { TableCardBody } from '@components/common/TableCardBody';
import { useScrollAnchor } from '@providers/scroll-anchor';
import { MessageCompiledInstruction, VersionedMessage } from '@solana/web3.js';
import React from 'react';

import getInstructionCardScrollAnchorId from '@/app/utils/get-instruction-card-scroll-anchor-id';

import { AddressFromLookupTableWithContext, AddressWithContext, programValidator } from './AddressWithContext';
import { fillAddressTableLookupsAccounts, findLookupAddress } from './utils';

export function UnknownDetailsCard({
    index,
    ix,
    message,
    programName,
}: {
    index: number;
    ix: MessageCompiledInstruction;
    message: VersionedMessage;
    programName: string;
}) {
    const [expanded, setExpanded] = React.useState(false);

    const scrollAnchorRef = useScrollAnchor(getInstructionCardScrollAnchorId([index + 1]));

    const lookupsForAccountKeyIndex = fillAddressTableLookupsAccounts(message.addressTableLookups);

    return (
        <div className="card" ref={scrollAnchorRef}>
            <div className={`card-header${!expanded ? ' border-bottom-none' : ''}`}>
                <h3 className="card-header-title mb-0 d-flex align-items-center">
                    <span className={`badge bg-info-soft me-2`}>#{index + 1}</span>
                    {programName} Instruction
                </h3>

                <button
                    className={`btn btn-sm d-flex ${expanded ? 'btn-black active' : 'btn-white'}`}
                    onClick={() => setExpanded(e => !e)}
                >
                    {expanded ? 'Collapse' : 'Expand'}
                </button>
            </div>
            {expanded && (
                <TableCardBody>
                    <tr>
                        <td>Program</td>
                        <td className="text-lg-end">
                            <AddressWithContext
                                pubkey={message.staticAccountKeys[ix.programIdIndex]}
                                validator={programValidator}
                            />
                        </td>
                    </tr>
                    {ix.accountKeyIndexes.map((accountIndex, index) => {
                        const { lookup, dynamicLookups } = findLookupAddress(
                            accountIndex,
                            message,
                            lookupsForAccountKeyIndex
                        );

                        return (
                            <tr key={index}>
                                <td>
                                    <div className="d-flex align-items-start flex-column">
                                        Account #{index + 1}
                                        <span className="mt-1">
                                            {accountIndex < message.header.numRequiredSignatures && (
                                                <span className="badge bg-info-soft me-2">Signer</span>
                                            )}
                                            {message.isAccountWritable(accountIndex) && (
                                                <span className="badge bg-danger-soft me-2">Writable</span>
                                            )}
                                        </span>
                                    </div>
                                </td>
                                <td className="text-lg-end">
                                    {dynamicLookups.isStatic ? (
                                        <AddressWithContext pubkey={lookup} />
                                    ) : (
                                        <AddressFromLookupTableWithContext
                                            lookupTableKey={dynamicLookups.lookups.lookupTableKey}
                                            lookupTableIndex={dynamicLookups.lookups.lookupTableIndex}
                                        />
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    <tr>
                        <td>
                            Instruction Data <span className="text-muted">(Hex)</span>
                        </td>
                        <td className="text-lg-end">
                            <HexData raw={Buffer.from(ix.data)} />
                        </td>
                    </tr>
                </TableCardBody>
            )}
        </div>
    );
}
