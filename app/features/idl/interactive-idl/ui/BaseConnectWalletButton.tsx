import WalletIcon from '@img/icons/wallet.svg';
import { Button } from '@shared/ui/button';
import Image from 'next/image';

type BaseConnectWalletButtonProps = {
    displayAddress: string;
    onClick?: () => void;
    isVisible?: boolean;
};

export function BaseConnectWalletButton({ displayAddress, onClick, isVisible = true }: BaseConnectWalletButtonProps) {
    if (!isVisible) {
        return null;
    }

    return (
        <Button variant="outline" size="sm" onClick={onClick}>
            <Image src={WalletIcon} width={12} height={12} alt="" />
            <div className="e-whitespace-nowrap">{displayAddress}</div>
        </Button>
    );
}
