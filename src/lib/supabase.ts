import 'react-native-url-polyfill/auto';

import {
  createClient,
  processLock,
} from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

import { supabasePublishableKey, supabaseUrl } from './env';

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) =>
    SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      storage: secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  },
);
