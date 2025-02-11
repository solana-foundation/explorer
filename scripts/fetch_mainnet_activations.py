import asyncio
from solana.rpc.async_api import AsyncClient

from solders.pubkey import Pubkey

import json

FEATURE_GATES_PATH = 'app/utils/feature-gate/featureGates.json'
def get_features():
    with open(FEATURE_GATES_PATH, 'r') as f:
        return json.load(f)

MINIMUM_SLOT_PER_EPOCH = 32;

def trailing_zeros(n: int) -> int:
    return (n & -n).bit_length() - 1


def next_power_of_two(n: int) -> int:
    return 1 << (n - 1).bit_length()


def get_epoch_for_slot(epoch_schedule: dict, slot: int) -> int:
    if slot < epoch_schedule.first_normal_slot:
        # Calculate epoch for pre-MAINNET period
        power = next_power_of_two(slot + MINIMUM_SLOT_PER_EPOCH + 1)
        epoch = (trailing_zeros(power) - 
                 trailing_zeros(MINIMUM_SLOT_PER_EPOCH) - 
                 1)
        return epoch
    else:
        # Calculate epoch for normal period
        normal_slot_index = slot - epoch_schedule.first_normal_slot
        normal_epoch_index = normal_slot_index // epoch_schedule.slots_per_epoch
        return epoch_schedule.first_normal_epoch + normal_epoch_index


async def main():
    features = get_features()

    connection = AsyncClient('https://api.mainnet-beta.solana.com')
    epoch_schedule = (await connection.get_epoch_schedule()).value

    for feature in features:
        if feature['devnetActivationEpoch'] and feature['testnetActivationEpoch'] and not feature['mainnetActivationEpoch']:
            print("Fetching feature gate", feature['key'])
            account = await connection.get_account_info(Pubkey.from_string(feature['key']))

            if account.value and account.value.data:
                # First byte indicates if activated (1) or not (0)
                is_activated = account.value.data[0]
                
                if is_activated:
                    # If activated, next 8 bytes contain activation slot as u64
                    activation_slot = int.from_bytes(account.value.data[1:9], 'little')

                    # Technically, feature gates only become active in the following epoch
                    activation_epoch = get_epoch_for_slot(epoch_schedule, activation_slot) + 1

                    print(feature['key'], 'activated at', activation_epoch)
                    feature['mainnetActivationEpoch'] = activation_epoch
                else:
                    print(feature['key'], "initialized, but not activated")

    with open(FEATURE_GATES_PATH, 'w') as f:
        json.dump(features, f, indent=2)

if __name__ == '__main__':
    asyncio.run(main())
