import { InstructionCard } from '@components/instruction/InstructionCard';
import {
    decodeAddPerpMarket,
    decodeAddSpotMarket,
    decodeCancelPerpOrder,
    decodeCancelSpotOrder,
    decodeChangePerpMarketParams,
    decodeConsumeEvents,
    decodePlacePerpOrder,
    decodePlacePerpOrder2,
    decodePlaceSpotOrder,
    parseMangoInstructionTitle,
} from '@explorer/decoder-mango';
import { useCluster } from '@providers/cluster';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';

import { Logger } from '@/app/shared/lib/logger';

import { AddOracleDetailsCard } from './AddOracleDetailsCard';
import { AddPerpMarketDetailsCard } from './AddPerpMarketDetailsCard';
import { AddSpotMarketDetailsCard } from './AddSpotMarketDetailsCard';
import { CancelPerpOrderDetailsCard } from './CancelPerpOrderDetailsCard';
import { CancelSpotOrderDetailsCard } from './CancelSpotOrderDetailsCard';
import { ChangePerpMarketParamsDetailsCard } from './ChangePerpMarketParamsDetailsCard';
import { ConsumeEventsDetailsCard } from './ConsumeEventsDetailsCard';
import { GenericMangoAccountDetailsCard } from './GenericMangoAccountDetailsCard';
import { GenericPerpMangoDetailsCard } from './GenericPerpMangoDetailsCard';
import { GenericSpotMangoDetailsCard } from './GenericSpotMangoDetailsCard';
import { PlacePerpOrder2DetailsCard } from './PlacePerpOrder2DetailsCard';
import { PlacePerpOrderDetailsCard } from './PlacePerpOrderDetailsCard';
import { PlaceSpotOrderDetailsCard } from './PlaceSpotOrderDetailsCard';

export function MangoDetailsCard(props: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    signature: string;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, signature, innerCards, childIndex } = props;

    const { url } = useCluster();

    let title;
    try {
        title = parseMangoInstructionTitle(ix);

        switch (title) {
            case 'InitMangoAccount':
                return <GenericMangoAccountDetailsCard mangoAccountKeyLocation={1} title={title} {...props} />;
            case 'Deposit':
                return <GenericMangoAccountDetailsCard mangoAccountKeyLocation={1} title={title} {...props} />;
            case 'Withdraw':
                return <GenericMangoAccountDetailsCard mangoAccountKeyLocation={1} title={title} {...props} />;
            case 'InitSpotOpenOrders':
                return <GenericMangoAccountDetailsCard mangoAccountKeyLocation={1} title={title} {...props} />;
            case 'PlaceSpotOrder':
                return <PlaceSpotOrderDetailsCard info={decodePlaceSpotOrder(ix)} {...props} />;
            case 'CancelSpotOrder':
                return <CancelSpotOrderDetailsCard info={decodeCancelSpotOrder(ix)} {...props} />;
            case 'AddPerpMarket':
                return <AddPerpMarketDetailsCard info={decodeAddPerpMarket(ix)} {...props} />;
            case 'PlacePerpOrder':
                return <PlacePerpOrderDetailsCard info={decodePlacePerpOrder(ix)} {...props} />;
            case 'PlacePerpOrder2':
                return <PlacePerpOrder2DetailsCard info={decodePlacePerpOrder2(ix)} {...props} />;
            case 'ConsumeEvents':
                return <ConsumeEventsDetailsCard info={decodeConsumeEvents(ix)} {...props} />;
            case 'CancelPerpOrder':
                return <CancelPerpOrderDetailsCard info={decodeCancelPerpOrder(ix)} {...props} />;
            case 'SettleFunds':
                return (
                    <GenericSpotMangoDetailsCard
                        accountKeyLocation={2}
                        spotMarketkeyLocation={5}
                        title={title}
                        {...props}
                    />
                );
            case 'RedeemMngo':
                return (
                    <GenericPerpMangoDetailsCard
                        mangoAccountKeyLocation={3}
                        perpMarketKeyLocation={4}
                        title={title}
                        {...props}
                    />
                );
            case 'ChangePerpMarketParams':
                return <ChangePerpMarketParamsDetailsCard info={decodeChangePerpMarketParams(ix)} {...props} />;
            case 'AddOracle':
                return <AddOracleDetailsCard {...props} />;
            case 'AddSpotMarket':
                return <AddSpotMarketDetailsCard info={decodeAddSpotMarket(ix)} {...props} />;
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
            title={`Mango Program: ${title || 'Unknown'}`}
            innerCards={innerCards}
            childIndex={childIndex}
            defaultRaw
        />
    );
}
