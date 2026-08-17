import { buttonVariants } from '@components/shared/ui/button';
import { cn } from '@components/shared/utils';
import { ClusterStatus } from '@utils/cluster';
import { cva } from 'class-variance-authority';

// The pill every switcher entry renders as, shared so the active one looks the same in either list.
//
// Base = dashkit Button base + full width (legacy `btn col-12`); active states keep the transparent base
// bg with the status color on border+text (legacy `border-* text-*` utilities).
//
// Every `text-*` here needs its `hover:text-*` twin: these render as `<a>`, and styles.css `a:hover`
// (0,1,1) outranks a bare `text-*` class (0,1,0), so without the twin the dashkit link green wins on
// hover and the text stops matching the border. `hover:text-*` is (0,2,0) and takes it back.
export const clusterButtonVariants = cva(cn(buttonVariants({ size: 'default', ui: 'dashkit' }), 'w-full'), {
    compoundVariants: [
        {
            active: true,
            className: 'border-[#1dd79b] text-[#1dd79b] hover:text-[#1dd79b]',
            status: ClusterStatus.Connected,
        },
        {
            active: true,
            className: 'border-[#fa62fc] text-[#fa62fc] hover:text-[#fa62fc]',
            status: ClusterStatus.Connecting,
        },
        {
            active: true,
            className: 'border-[#b45be1] text-[#b45be1] hover:text-[#b45be1]',
            status: ClusterStatus.Failure,
        },
    ],
    defaultVariants: {
        active: false,
    },
    variants: {
        active: {
            false: 'bg-[#1e2423] border-[#343a37] text-white hover:bg-[#1a1f1e] hover:border-[#2a2e2c] hover:text-white',
            true: '',
        },
        status: {
            [ClusterStatus.Connected]: '',
            [ClusterStatus.Connecting]: '',
            [ClusterStatus.Failure]: '',
        },
    },
});
