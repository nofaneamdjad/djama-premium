import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",

  // Capture 10 % des traces de performance
  tracesSampleRate: 0.1,

  // Ne logge pas dans la console en production
  debug: false,
});
