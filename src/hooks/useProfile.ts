import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../lib/supabase';

export type Profile = {
  display_name: string | null;
  id: string;
  preferred_weight_unit: 'lb' | 'kg';
};

export function useProfile() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!session?.user.id) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, preferred_weight_unit')
      .eq('id', session.user.id)
      .single();

    if (error) {
      setErrorMessage(error.message);
      setProfile(null);
    } else {
      setProfile(data as Profile);
    }

    setIsLoading(false);
  }, [session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  return {
    errorMessage,
    isLoading,
    profile,
    refreshProfile: loadProfile,
  };
}
