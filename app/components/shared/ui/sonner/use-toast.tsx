// TODO(fsd): relocate this module to @shared or the appropriate feature/entity layer.
import { ExternalToast, toast } from 'sonner';

import { CustomToast, type CustomToastProps } from './custom';

export const useToast = () => ({
    custom: (props: Omit<CustomToastProps, 'id'>, data?: ExternalToast) =>
        toast.custom(id => <CustomToast id={id} {...props} />, data),
});
