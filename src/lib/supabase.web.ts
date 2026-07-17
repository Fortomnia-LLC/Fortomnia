import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { supabasePublishableKey, supabaseUrl } from './env';

const webStorage = {
  async getItem(key: string) {
    if (typeof window === 'undefined') return null;
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (typeof window === 'undefined') return;
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    if (typeof window === 'undefined') return;
    await AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      storage: webStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
