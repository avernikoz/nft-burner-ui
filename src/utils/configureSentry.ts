import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/browser";
import { sentryDSN, APP_ENVIRONMENT } from "../config/config";

export const configureSentry = () => {
    Sentry.init({
        dsn: sentryDSN,
        environment: APP_ENVIRONMENT,
        integrations: [new BrowserTracing()],
        tracesSampleRate: 0.3,
        maxValueLength: 250,
        maxBreadcrumbs: 50,
        beforeSend(event) {
            // Remove console log breadcrumbs because if accidentally we left some too huge console debug sentry will discard all events because they will exceeed the max size
            if (event.breadcrumbs) {
                event.breadcrumbs = event.breadcrumbs.filter((breadcrumb) => breadcrumb.category !== "console");
            }
            return event;
        },
        ignoreErrors: [/dapp doesn't have the require/],
    });
};
