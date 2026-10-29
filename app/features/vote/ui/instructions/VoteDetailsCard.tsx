import { type InstructionNode, UnknownDetailsCard } from '@entities/instruction-card';
import { ParsedInfo } from '@validators/index';
import { create } from 'superstruct';

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
import { AuthorizeCheckedDetailsCard, AuthorizeDetailsCard } from './AuthorizeDetailsCard';
import { AuthorizeCheckedWithSeedDetailsCard, AuthorizeWithSeedDetailsCard } from './AuthorizeWithSeedDetailsCard';
import { DepositDelegatorRewardsDetailsCard } from './DepositDelegatorRewardsDetailsCard';
import { InitializeDetailsCard } from './InitializeDetailsCard';
import { InitializeV2DetailsCard } from './InitializeV2DetailsCard';
import { LegacyVoteDetailsCard, LegacyVoteSwitchDetailsCard } from './LegacyVoteDetailsCard';
import { TowerSyncDetailsCard, TowerSyncSwitchDetailsCard } from './TowerSyncDetailsCard';
import { UpdateCommissionBpsDetailsCard } from './UpdateCommissionBpsDetailsCard';
import { UpdateCommissionCollectorDetailsCard } from './UpdateCommissionCollectorDetailsCard';
import { UpdateCommissionDetailsCard } from './UpdateCommissionDetailsCard';
import { UpdateValidatorIdentityDetailsCard } from './UpdateValidatorIdentityDetailsCard';
import {
    CompactUpdateVoteStateDetailsCard,
    CompactUpdateVoteStateSwitchDetailsCard,
    UpdateVoteStateDetailsCard,
    UpdateVoteStateSwitchDetailsCard,
} from './UpdateVoteStateDetailsCard';
import { WithdrawDetailsCard } from './WithdrawDetailsCard';

type DetailsProps = {
    node: InstructionNode;
    parsed: unknown;
};

export function VoteDetailsCard({ node, parsed }: DetailsProps) {
    const parsedInfo = create(parsed, ParsedInfo);

    switch (parsedInfo.type) {
        case 'initialize': {
            const info = create(parsedInfo.info, InitializeInfo);
            return <InitializeDetailsCard info={info} node={node} />;
        }
        case 'initializeV2': {
            const info = create(parsedInfo.info, InitializeV2Info);
            return <InitializeV2DetailsCard info={info} node={node} />;
        }
        case 'authorize': {
            const info = create(parsedInfo.info, AuthorizeInfo);
            return <AuthorizeDetailsCard info={info} node={node} />;
        }
        case 'authorizeChecked': {
            const info = create(parsedInfo.info, AuthorizeInfo);
            return <AuthorizeCheckedDetailsCard info={info} node={node} />;
        }
        case 'authorizeWithSeed': {
            const info = create(parsedInfo.info, AuthorizeWithSeedInfo);
            return <AuthorizeWithSeedDetailsCard info={info} node={node} />;
        }
        case 'authorizeCheckedWithSeed': {
            const info = create(parsedInfo.info, AuthorizeWithSeedInfo);
            return <AuthorizeCheckedWithSeedDetailsCard info={info} node={node} />;
        }
        case 'vote': {
            const info = create(parsedInfo.info, VoteInfo);
            return <LegacyVoteDetailsCard info={info} node={node} />;
        }
        case 'voteSwitch': {
            const info = create(parsedInfo.info, VoteInfo);
            return <LegacyVoteSwitchDetailsCard info={info} node={node} />;
        }
        case 'updatevotestate': {
            const info = create(parsedInfo.info, UpdateVoteStateInfo);
            return <UpdateVoteStateDetailsCard info={info} node={node} />;
        }
        case 'updatevotestateswitch': {
            const info = create(parsedInfo.info, UpdateVoteStateInfo);
            return <UpdateVoteStateSwitchDetailsCard info={info} node={node} />;
        }
        case 'compactupdatevotestate': {
            const info = create(parsedInfo.info, UpdateVoteStateInfo);
            return <CompactUpdateVoteStateDetailsCard info={info} node={node} />;
        }
        case 'compactupdatevotestateswitch': {
            const info = create(parsedInfo.info, UpdateVoteStateInfo);
            return <CompactUpdateVoteStateSwitchDetailsCard info={info} node={node} />;
        }
        case 'towersync': {
            const info = create(parsedInfo.info, TowerSyncInfo);
            return <TowerSyncDetailsCard info={info} node={node} />;
        }
        case 'towersyncswitch': {
            const info = create(parsedInfo.info, TowerSyncInfo);
            return <TowerSyncSwitchDetailsCard info={info} node={node} />;
        }
        case 'withdraw': {
            const info = create(parsedInfo.info, WithdrawInfo);
            return <WithdrawDetailsCard info={info} node={node} />;
        }
        case 'updateValidatorIdentity': {
            const info = create(parsedInfo.info, UpdateValidatorIdentityInfo);
            return <UpdateValidatorIdentityDetailsCard info={info} node={node} />;
        }
        case 'updateCommission': {
            const info = create(parsedInfo.info, UpdateCommissionInfo);
            return <UpdateCommissionDetailsCard info={info} node={node} />;
        }
        case 'updateCommissionBps': {
            const info = create(parsedInfo.info, UpdateCommissionBpsInfo);
            return <UpdateCommissionBpsDetailsCard info={info} node={node} />;
        }
        case 'updateCommissionCollector': {
            const info = create(parsedInfo.info, UpdateCommissionCollectorInfo);
            return <UpdateCommissionCollectorDetailsCard info={info} node={node} />;
        }
        case 'depositDelegatorRewards': {
            const info = create(parsedInfo.info, DepositDelegatorRewardsInfo);
            return <DepositDelegatorRewardsDetailsCard info={info} node={node} />;
        }
        default:
            return <UnknownDetailsCard node={node} />;
    }
}
