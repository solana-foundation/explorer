import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { MessageCircle } from 'react-feather';

import { Button } from '@/app/components/shared/ui/button';

export type BaseFeedbackWidgetProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const BaseFeedbackWidget = forwardRef<HTMLButtonElement, BaseFeedbackWidgetProps>((props, ref) => (
    <Button
        ref={ref}
        className="cursor-pointer !bg-dark-background hover:!bg-dark-border"
        size="sm"
        variant="outline"
        {...props}
    >
        <MessageCircle />
        Feedback
    </Button>
));

BaseFeedbackWidget.displayName = 'BaseFeedbackWidget';
