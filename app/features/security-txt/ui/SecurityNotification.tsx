import { isUpgradeableLoaderAccountData, type ParsedData } from '@providers/accounts';

import { useSecurityTxt } from '../model/useSecurityTxt';
import { BaseSecurityNotification } from './BaseSecurityNotificaton';

export function SecurityNotification({ parsedData, address }: { parsedData: ParsedData | undefined; address: string }) {
    const securityTxt = useSecurityTxt(
        address,
        parsedData && isUpgradeableLoaderAccountData(parsedData) ? { programData: parsedData.programData } : undefined
    );

    if (!parsedData || !isUpgradeableLoaderAccountData(parsedData)) return null;

    const message = extractMessage(securityTxt);
    if (!message) return null;

    return <BaseSecurityNotification message={message} />;
}

function extractMessage(securityTxt: ReturnType<typeof useSecurityTxt>): string | null {
    if (!securityTxt) return null;
    if ('notification' in securityTxt && securityTxt.notification) return securityTxt.notification;
    return null;
}
