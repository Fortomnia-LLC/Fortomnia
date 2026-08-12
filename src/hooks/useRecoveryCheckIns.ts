import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import { getLocalDateKey } from "../lib/dates";
import {
  calculateReadiness,
  type ReadinessResult,
} from "../lib/readiness";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

export type RecoveryCheckIn = {
  body_weight: number | null;
  body_weight_unit: "lb" | "kg" | null;
  checkin_date: string;
  created_at: string;
  energy_level: number;
  id: string;
  mood: number;
  muscle_soreness: number;
  notes: string | null;
  sleep_duration_minutes: number;
  sleep_quality: number;
  stress_level: number;
  updated_at: string;
};

export type RecoveryCheckInInput = {
  bodyWeight: number | null;
  bodyWeightUnit: "lb" | "kg" | null;
  checkinDate: string;
  energyLevel: number;
  mood: number;
  muscleSoreness: number;
  notes: string | null;
  sleepDurationMinutes: number;
  sleepQuality: number;
  stressLevel: number;
};

export type RecoveryDay = RecoveryCheckIn & {
  readiness: ReadinessResult;
};

type RecoveryCheckInRow = Omit<RecoveryCheckIn, "body_weight"> & {
  body_weight: number | string | null;
};

function normalizeCheckIn(row: RecoveryCheckInRow): RecoveryCheckIn {
  return {
    ...row,
    body_weight:
      row.body_weight === null ? null : Number(row.body_weight),
  };
}

function getWindowStart(endDate: string): string {
  const date = new Date(`${endDate}T12:00:00`);
  date.setDate(date.getDate() - 6);
  return getLocalDateKey(date);
}

function getReadiness(checkIn: RecoveryCheckIn): ReadinessResult {
  return calculateReadiness({
    energyLevel: checkIn.energy_level,
    mood: checkIn.mood,
    muscleSoreness: checkIn.muscle_soreness,
    sleepDurationMinutes: checkIn.sleep_duration_minutes,
    sleepQuality: checkIn.sleep_quality,
    stressLevel: checkIn.stress_level,
  });
}

export function useRecoveryCheckIns(endDate = getLocalDateKey()) {
  const { session } = useAuth();
  const [checkIns, setCheckIns] = useState<RecoveryCheckIn[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadRecovery = useCallback(async () => {
    if (!session?.user.id) {
      setCheckIns([]);
      setErrorMessage("No authenticated user was found.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from("daily_recovery_checkins")
      .select(
        `
          id,
          checkin_date,
          sleep_duration_minutes,
          sleep_quality,
          energy_level,
          muscle_soreness,
          stress_level,
          mood,
          body_weight,
          body_weight_unit,
          notes,
          created_at,
          updated_at
        `,
      )
      .eq("user_id", session.user.id)
      .gte("checkin_date", getWindowStart(endDate))
      .lte("checkin_date", endDate)
      .order("checkin_date", { ascending: false });

    if (error) {
      setCheckIns([]);
      setErrorMessage(error.message);
    } else {
      setCheckIns(
        ((data ?? []) as RecoveryCheckInRow[]).map(normalizeCheckIn),
      );
    }

    setIsLoading(false);
  }, [endDate, session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      void loadRecovery();
    }, [loadRecovery]),
  );

  const days = useMemo<RecoveryDay[]>(
    () =>
      checkIns.map((checkIn) => ({
        ...checkIn,
        readiness: getReadiness(checkIn),
      })),
    [checkIns],
  );

  const currentDay = useMemo(
    () => days.find((day) => day.checkin_date === endDate) ?? null,
    [days, endDate],
  );

  const saveRecoveryCheckIn = useCallback(
    async (input: RecoveryCheckInInput): Promise<boolean> => {
      if (!session?.user.id) {
        setErrorMessage("No authenticated user was found.");
        return false;
      }

      setIsSaving(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("daily_recovery_checkins")
        .upsert(
          {
            body_weight: input.bodyWeight,
            body_weight_unit: input.bodyWeightUnit,
            checkin_date: input.checkinDate,
            energy_level: input.energyLevel,
            mood: input.mood,
            muscle_soreness: input.muscleSoreness,
            notes: input.notes,
            sleep_duration_minutes: input.sleepDurationMinutes,
            sleep_quality: input.sleepQuality,
            stress_level: input.stressLevel,
            updated_at: new Date().toISOString(),
            user_id: session.user.id,
          },
          { onConflict: "user_id,checkin_date" },
        )
        .select(
          `
            id,
            checkin_date,
            sleep_duration_minutes,
            sleep_quality,
            energy_level,
            muscle_soreness,
            stress_level,
            mood,
            body_weight,
            body_weight_unit,
            notes,
            created_at,
            updated_at
          `,
        )
        .single();

      setIsSaving(false);

      if (error || !data) {
        setErrorMessage(error?.message ?? "The recovery check-in was not saved.");
        return false;
      }

      const saved = normalizeCheckIn(data as RecoveryCheckInRow);

      setCheckIns((current) =>
        [saved, ...current.filter((item) => item.id !== saved.id)].sort(
          (left, right) =>
            right.checkin_date.localeCompare(left.checkin_date),
        ),
      );

      return true;
    },
    [session?.user.id],
  );

  return {
    currentDay,
    days,
    errorMessage,
    isLoading,
    isSaving,
    refreshRecovery: loadRecovery,
    saveRecoveryCheckIn,
  };
}
