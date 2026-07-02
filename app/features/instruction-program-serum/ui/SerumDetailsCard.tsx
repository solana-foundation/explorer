import { InstructionCard } from '@components/instruction/InstructionCard';
import {
    decodeCancelOrder,
    decodeCancelOrderByClientId,
    decodeCancelOrderByClientIdV2,
    decodeCancelOrderV2,
    decodeCloseOpenOrders,
    decodeConsumeEvents,
    decodeConsumeEventsPermissioned,
    decodeDisableMarket,
    decodeInitializeMarket,
    decodeInitOpenOrders,
    decodeMatchOrders,
    decodeNewOrder,
    decodeNewOrderV3,
    decodePrune,
    decodeSettleFunds,
    decodeSweepFees,
    getSerumInstructionLabel,
    OPENBOOK_DEX_PROGRAM_LABEL,
    parseSerumInstructionKey,
} from '@explorer/decoder-serum';
import { useCluster } from '@providers/cluster';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { Logger } from '@/app/shared/lib/logger';

import { CancelOrderByClientIdDetailsCard } from './CancelOrderByClientIdDetails';
import { CancelOrderByClientIdV2DetailsCard } from './CancelOrderByClientIdV2Details';
import { CancelOrderDetailsCard } from './CancelOrderDetails';
import { CancelOrderV2DetailsCard } from './CancelOrderV2Details';
import { CloseOpenOrdersDetailsCard } from './CloseOpenOrdersDetails';
import { ConsumeEventsDetailsCard } from './ConsumeEventsDetails';
import { ConsumeEventsPermissionedDetailsCard } from './ConsumeEventsPermissionedDetails';
import { DisableMarketDetailsCard } from './DisableMarketDetails';
import { InitializeMarketDetailsCard } from './InitializeMarketDetailsCard';
import { InitOpenOrdersDetailsCard } from './InitOpenOrdersDetails';
import { MatchOrdersDetailsCard } from './MatchOrdersDetailsCard';
import { NewOrderDetailsCard } from './NewOrderDetailsCard';
import { NewOrderV3DetailsCard } from './NewOrderV3DetailsCard';
import { PruneDetailsCard } from './PruneDetails';
import { SettleFundsDetailsCard } from './SettleFundsDetailsCard';
import { SweepFeesDetailsCard } from './SweepFeesDetails';

export function SerumDetailsCard(initialProps: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    signature: string;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, signature, innerCards, childIndex } = initialProps;

    // Deprecated Serum deployments never reach this card (they render the generic name-only card), so OpenBook is the only program left.
    const props = React.useMemo(() => ({ ...initialProps, programName: OPENBOOK_DEX_PROGRAM_LABEL }), [initialProps]);

    const { url } = useCluster();

    try {
        switch (parseSerumInstructionKey(ix)) {
            case 'initializeMarket':
                return <InitializeMarketDetailsCard info={decodeInitializeMarket(ix)} {...props} />;
            case 'newOrder':
                return <NewOrderDetailsCard info={decodeNewOrder(ix)} {...props} />;
            case 'matchOrders':
                return <MatchOrdersDetailsCard info={decodeMatchOrders(ix)} {...props} />;
            case 'consumeEvents':
                return <ConsumeEventsDetailsCard info={decodeConsumeEvents(ix)} {...props} />;
            case 'cancelOrder':
                return <CancelOrderDetailsCard info={decodeCancelOrder(ix)} {...props} />;
            case 'settleFunds':
                return <SettleFundsDetailsCard info={decodeSettleFunds(ix)} {...props} />;
            case 'cancelOrderByClientId':
                return <CancelOrderByClientIdDetailsCard info={decodeCancelOrderByClientId(ix)} {...props} />;
            case 'disableMarket':
                return <DisableMarketDetailsCard info={decodeDisableMarket(ix)} {...props} />;
            case 'sweepFees':
                return <SweepFeesDetailsCard info={decodeSweepFees(ix)} {...props} />;
            case 'newOrderV3':
                return <NewOrderV3DetailsCard info={decodeNewOrderV3(ix)} {...props} />;
            case 'cancelOrderV2':
                return <CancelOrderV2DetailsCard info={decodeCancelOrderV2(ix)} {...props} />;
            case 'cancelOrderByClientIdV2':
                return <CancelOrderByClientIdV2DetailsCard info={decodeCancelOrderByClientIdV2(ix)} {...props} />;
            case 'closeOpenOrders':
                return <CloseOpenOrdersDetailsCard info={decodeCloseOpenOrders(ix)} {...props} />;
            case 'initOpenOrders':
                return <InitOpenOrdersDetailsCard info={decodeInitOpenOrders(ix)} {...props} />;
            case 'prune':
                return <PruneDetailsCard info={decodePrune(ix)} {...props} />;
            case 'consumeEventsPermissioned':
                return <ConsumeEventsPermissionedDetailsCard info={decodeConsumeEventsPermissioned(ix)} {...props} />;
        }
    } catch (error) {
        Logger.error(error, {
            signature,
            url,
        });
    }

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={`${props.programName} Program: ${getSerumInstructionLabel(ix)}`}
            innerCards={innerCards}
            childIndex={childIndex}
            defaultRaw
        />
    );
}
