import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../lib/supabase';
import type { TrainingLocation } from '../lib/coachQuestionnaire';
import type {
  TrainingGoal,
  TrainingStyle,
} from '../lib/coachProfile';

export type Profile = {
  available_equipment: import("../lib/equipment").EquipmentOption[];
  activity_level: "sedentary" | "light" | "moderate" | "very_active";
  age_years: number | null;
  calorie_direction: "lose" | "maintain" | "gain";
  coach_cardio_focus: string | null;
  coach_mobility_focus: string | null;
  coach_nutrition_focus: string | null;
  coach_preferred_cardio: string[];
  coach_primary_focus: string | null;
  coach_priority_metric_current: number | null;
  coach_priority_metric_name: string | null;
  coach_priority_metric_target: number | null;
  coach_priority_metric_unit: string | null;
  coach_session_minutes: number | null;
  coach_sports: string[];
  coach_target_event_date: string | null;
  coach_target_event_name: string | null;
  coach_training_location_details: string | null;
  coach_training_locations: TrainingLocation[];
  coach_weekly_training_days: number | null;
  equation_sex: "female" | "male" | null;
  favorite_athletes: string[];
  height_cm: number | null;
  display_name: string | null;
  id: string;
  preferred_weight_unit: 'lb' | 'kg';
  training_goals: TrainingGoal[];
  training_style: TrainingStyle;
  weight_kg: number | null;
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
      .select(
        'id, display_name, preferred_weight_unit, training_goals, training_style, favorite_athletes, age_years, height_cm, weight_kg, equation_sex, activity_level, calorie_direction, available_equipment, coach_primary_focus, coach_target_event_name, coach_target_event_date, coach_training_locations, coach_training_location_details, coach_weekly_training_days, coach_session_minutes, coach_sports, coach_priority_metric_name, coach_priority_metric_current, coach_priority_metric_target, coach_priority_metric_unit, coach_nutrition_focus, coach_cardio_focus, coach_mobility_focus, coach_preferred_cardio',
      )
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
