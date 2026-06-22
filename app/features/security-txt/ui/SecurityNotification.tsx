import { isUpgradeableLoaderAccountData, type ParsedData } from '@providers/accounts';

import { useSecurityTxt } from '../model/useSecurityTxt';
import { BaseSecurityNotification } from './BaseSecurityNotification';

// FIXME: missing Storybook story — needs useSecurityTxt mocked + an UpgradeableLoader ParsedData fixture.
export function SecurityNotification({ parsedData, address }: { parsedData: ParsedData | undefined; address: string }) {
    const { securityTxt } = useSecurityTxt(address);

    if (!parsedData || !isUpgradeableLoaderAccountData(parsedData)) return null;

    const message = securityTxt?.fields.notification;
    if (!message) return null;

    return <BaseSecurityNotification message={message} />;
}
