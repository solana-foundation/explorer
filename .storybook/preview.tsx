import '@/app/styles/styles.css';

import { createPreview } from './create-preview';

// MSW is opt-in: STORYBOOK_MSW=true registers the service worker so stories with
// `parameters.msw.handlers` mock network calls. Off by default so normal runs are untouched.
export default createPreview({ mswEnabled: process.env.STORYBOOK_MSW === 'true' });
