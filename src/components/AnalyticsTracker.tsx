import { usePathname } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { useEffect, useRef } from 'react';

import { analyticsScreenName } from '../lib/analytics';
import { useAuth } from '../providers/AuthProvider';

export function AnalyticsTracker() {
  const pathname = usePathname();
  const posthog = usePostHog();
  const { isLoading, session } = useAuth();
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    posthog.screen(analyticsScreenName(pathname));
  }, [pathname, posthog]);

  useEffect(() => {
    if (isLoading) return;

    const userId = session?.user.id ?? null;

    if (userId) {
      posthog.identify(userId, { account_type: 'registered' });
    } else if (previousUserId.current) {
      posthog.reset();
    }

    previousUserId.current = userId;
  }, [isLoading, posthog, session?.user.id]);

  return null;
}
