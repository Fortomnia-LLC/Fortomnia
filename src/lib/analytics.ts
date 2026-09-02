export function getPostHogConfig() {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Missing required environment variable: EXPO_PUBLIC_POSTHOG_API_KEY',
    );
  }

  return {
    apiKey,
    host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
  };
}

const sensitiveRouteSegment = /^(?:\d+|[0-9a-f]{8}-[0-9a-f-]{27})$/i;

export function analyticsScreenName(pathname: string): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;

  return (
    normalized
      .split('/')
      .map((segment) => (sensitiveRouteSegment.test(segment) ? ':id' : segment))
      .join('/') || '/'
  );
}
