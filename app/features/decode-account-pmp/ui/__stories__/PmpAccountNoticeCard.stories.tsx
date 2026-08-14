import { PMP_EMPTY_DISCRIMINATOR } from '@entities/pmp-account';
import { nextjsParameters } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { bufferAccountData, readAs } from '../__fixtures__/pmp-account-fixtures';
import { PmpAccountNoticeCard } from '../PmpAccountNoticeCard';

// No cluster or token decorators: this card renders alert text only, with no `Address` or `Signature` inside it.
const meta = {
    component: PmpAccountNoticeCard,
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/DecodeAccountPmp/PmpAccountNoticeCard',
} satisfies Meta<typeof PmpAccountNoticeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An Empty account is a Buffer whose discriminator byte was flipped, which is what `allocate` leaves behind. */
const EMPTY_ACCOUNT_DATA = (() => {
    const raw = bufferAccountData(new Uint8Array(0));
    raw[0] = PMP_EMPTY_DISCRIMINATOR;
    return raw;
})();

export const EmptyAccount: Story = {
    args: { result: readAs(EMPTY_ACCOUNT_DATA, 'empty') },
};

/** Shorter than the 96-byte header, which is the shape a reader reaching the URL by hand is most likely to hit. */
export const UnreadableAccount: Story = {
    args: { result: readAs(new Uint8Array(95), 'unreadable') },
};

/** The canonical client closes a `setData` source buffer to reclaim rent, so a historical buffer is normally gone. */
export const AbsentAccount: Story = {
    args: { result: { kind: 'absent' } },
};
