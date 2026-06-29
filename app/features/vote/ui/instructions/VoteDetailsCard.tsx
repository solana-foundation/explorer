import { UnknownDetailsCard } from '@components/instruction/UnknownDetailsCard';
import type { ParsedInstruction, ParsedTransaction, SignatureResult } from '@solana/web3.js';
import { ParsedInfo } from '@validators/index';
import { type ReactNode } from 'react';
import { create } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import {
    AuthorizeInfo,
    AuthorizeWithSeedInfo,
    DepositDelegatorRewardsInfo,
    InitializeInfo,
    InitializeV2Info,
    TowerSyncInfo,
    UpdateCommissionBpsInfo,
    UpdateCommissionCollectorInfo,
    UpdateCommissionInfo,
    UpdateValidatorIdentityInfo,
    UpdateVoteStateInfo,
    VoteInfo,
    WithdrawInfo,
} from '../../lib/instruction-types';
import { AuthorizeDetailsCard } from './AuthorizeDetailsCard';
import { AuthorizeWithSeedDetailsCard } from './AuthorizeWithSeedDetailsCard';
import { DepositDelegatorRewardsDetailsCard } from './DepositDelegatorRewardsDetailsCard';
import { InitializeDetailsCard } from './InitializeDetailsCard';
import { InitializeV2DetailsCard } from './InitializeV2DetailsCard';
import { LegacyVoteDetailsCard } from './LegacyVoteDetailsCard';
import { TowerSyncDetailsCard } from './TowerSyncDetailsCard';
import { UpdateCommissionBpsDetailsCard } from './UpdateCommissionBpsDetailsCard';
import { UpdateCommissionCollectorDetailsCard } from './UpdateCommissionCollectorDetailsCard';
import { UpdateCommissionDetailsCard } from './UpdateCommissionDetailsCard';
import { UpdateValidatorIdentityDetailsCard } from './UpdateValidatorIdentityDetailsCard';
import { UpdateVoteStateDetailsCard } from './UpdateVoteStateDetailsCard';
import { WithdrawDetailsCard } from './WithdrawDetailsCard';

type DetailsProps = {
    tx: ParsedTransaction;
    ix: ParsedInstruction;
    result: SignatureResult;
    index: number;
    innerCards?: ReactNode[];
    childIndex?: number;
};

export function VoteDetailsCard(props: DetailsProps) {
    // TODO: Replace this try/catch + Logger with a React error boundary one level up
    // (see the matching note in StakeDetailsCard).
    try {
        const parsed = create(props.ix.parsed, ParsedInfo);

        switch (parsed.type) {
            case 'initialize': {
                const info = create(parsed.info, InitializeInfo);
                return <InitializeDetailsCard info={info} {...props} />;
            }
            case 'initializeV2': {
                const info = create(parsed.info, InitializeV2Info);
                return <InitializeV2DetailsCard info={info} {...props} />;
            }
            case 'authorize': {
                const info = create(parsed.info, AuthorizeInfo);
                return <AuthorizeDetailsCard info={info} title="Vote: Authorize" {...props} />;
            }
            case 'authorizeChecked': {
                const info = create(parsed.info, AuthorizeInfo);
                return <AuthorizeDetailsCard info={info} title="Vote: Authorize Checked" {...props} />;
            }
            case 'authorizeWithSeed': {
                const info = create(parsed.info, AuthorizeWithSeedInfo);
                return <AuthorizeWithSeedDetailsCard info={info} title="Vote: Authorize With Seed" {...props} />;
            }
            case 'authorizeCheckedWithSeed': {
                const info = create(parsed.info, AuthorizeWithSeedInfo);
                return (
                    <AuthorizeWithSeedDetailsCard info={info} title="Vote: Authorize Checked With Seed" {...props} />
                );
            }
            case 'vote': {
                const info = create(parsed.info, VoteInfo);
                return <LegacyVoteDetailsCard info={info} title="Vote: Vote" {...props} />;
            }
            case 'voteSwitch': {
                const info = create(parsed.info, VoteInfo);
                return <LegacyVoteDetailsCard info={info} title="Vote: Vote Switch" {...props} />;
            }
            case 'updatevotestate': {
                const info = create(parsed.info, UpdateVoteStateInfo);
                return <UpdateVoteStateDetailsCard info={info} title="Vote: Update Vote State" {...props} />;
            }
            case 'updatevotestateswitch': {
                const info = create(parsed.info, UpdateVoteStateInfo);
                return <UpdateVoteStateDetailsCard info={info} title="Vote: Update Vote State Switch" {...props} />;
            }
            case 'compactupdatevotestate': {
                const info = create(parsed.info, UpdateVoteStateInfo);
                return <UpdateVoteStateDetailsCard info={info} title="Vote: Compact Update Vote State" {...props} />;
            }
            case 'compactupdatevotestateswitch': {
                const info = create(parsed.info, UpdateVoteStateInfo);
                return (
                    <UpdateVoteStateDetailsCard info={info} title="Vote: Compact Update Vote State Switch" {...props} />
                );
            }
            case 'towersync': {
                const info = create(parsed.info, TowerSyncInfo);
                return <TowerSyncDetailsCard info={info} title="Vote: Tower Sync" {...props} />;
            }
            case 'towersyncswitch': {
                const info = create(parsed.info, TowerSyncInfo);
                return <TowerSyncDetailsCard info={info} title="Vote: Tower Sync Switch" {...props} />;
            }
            case 'withdraw': {
                const info = create(parsed.info, WithdrawInfo);
                return <WithdrawDetailsCard info={info} {...props} />;
            }
            case 'updateValidatorIdentity': {
                const info = create(parsed.info, UpdateValidatorIdentityInfo);
                return <UpdateValidatorIdentityDetailsCard info={info} {...props} />;
            }
            case 'updateCommission': {
                const info = create(parsed.info, UpdateCommissionInfo);
                return <UpdateCommissionDetailsCard info={info} {...props} />;
            }
            case 'updateCommissionBps': {
                const info = create(parsed.info, UpdateCommissionBpsInfo);
                return <UpdateCommissionBpsDetailsCard info={info} {...props} />;
            }
            case 'updateCommissionCollector': {
                const info = create(parsed.info, UpdateCommissionCollectorInfo);
                return <UpdateCommissionCollectorDetailsCard info={info} {...props} />;
            }
            case 'depositDelegatorRewards': {
                const info = create(parsed.info, DepositDelegatorRewardsInfo);
                return <DepositDelegatorRewardsDetailsCard info={info} {...props} />;
            }
            default:
                return <UnknownDetailsCard {...props} />;
        }
    } catch (error) {
        Logger.error(error, {
            signature: props.tx.signatures[0],
        });
        return <UnknownDetailsCard {...props} />;
    }
}
