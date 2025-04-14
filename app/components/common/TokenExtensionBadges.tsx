export function TokenExtensionBadges({ token }: { token: any }) {
    // const { t } = useTranslation();
    // const { tokenExtensions } = useTokenExtensions(token);

    if (!token) return null;
    return 234;
    // return (
    //     <div className="flex flex-wrap gap-1">
    //         {tokenExtensions.map(extension => (
    //             <div key={extension.type} className="bg-gray-200 dark:bg-gray-800 rounded px-2 py-1 text-xs">
    //                 {t(`tokenExtensions.${extension.type}`)}
    //             </div>
    //         ))}
    //     </div>
    // );
}
