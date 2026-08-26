import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import { supabase } from "../lib/supabase";

export type SupplementCategory =
  | "vitamin"
  | "mineral"
  | "performance"
  | "wellness"
  | "prescription"
  | "hormone"
  | "peptide"
  | "other";

export type SupplementRoute =
  | "oral"
  | "injection"
  | "topical"
  | "sublingual"
  | "inhaled"
  | "other";

export type SupplementFrequency =
  | "daily"
  | "weekly"
  | "every_other_week"
  | "selected_days"
  | "as_needed";

export type SupplementDoseSlot = "single" | "morning" | "evening";

export type SupplementProtocol = {
  category: SupplementCategory;
  dose_amount: number;
  dose_unit: string;
  doses_per_day: 1 | 2;
  end_date: string | null;
  frequency: SupplementFrequency;
  id: string;
  is_active: boolean;
  name: string;
  notes: string | null;
  route: SupplementRoute;
  scheduled_days: number[];
  scheduled_time: string | null;
  second_scheduled_time: string | null;
  start_date: string;
};

export type SupplementLog = {
  completed_at: string;
  dose_amount: number;
  dose_slot: SupplementDoseSlot;
  dose_unit: string;
  id: string;
  log_date: string;
  notes: string | null;
  protocol_id: string;
  status: "taken" | "skipped";
};

type SupplementProtocolRow = Omit<SupplementProtocol, "dose_amount"> & {
  dose_amount: number | string;
};

type SupplementLogRow = Omit<SupplementLog, "dose_amount"> & {
  dose_amount: number | string;
};

export function getSupplementLogKey(
  protocolId: string,
  doseSlot: SupplementDoseSlot,
) {
  return `${protocolId}:${doseSlot}`;
}

export function useSupplements(logDate: string) {
  const [protocols, setProtocols] = useState<SupplementProtocol[]>([]);
  const [logs, setLogs] = useState<SupplementLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSupplements = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const [protocolsResult, logsResult] = await Promise.all([
      supabase
        .from("supplement_protocols")
        .select(
          `
            id,
            name,
            category,
            dose_amount,
            dose_unit,
            route,
            frequency,
            scheduled_days,
            scheduled_time,
            second_scheduled_time,
            doses_per_day,
            start_date,
            end_date,
            is_active,
            notes
          `,
        )
        .order("is_active", { ascending: false })
        .order("name"),
      supabase
        .from("supplement_logs")
        .select(
          `
            id,
            protocol_id,
            log_date,
            status,
            dose_slot,
            completed_at,
            dose_amount,
            dose_unit,
            notes
          `,
        )
        .eq("log_date", logDate)
        .order("completed_at"),
    ]);

    if (protocolsResult.error || logsResult.error) {
      setProtocols([]);
      setLogs([]);
      setErrorMessage(
        protocolsResult.error?.message ??
          logsResult.error?.message ??
          "Supplement data could not load.",
      );
      setIsLoading(false);
      return;
    }

    setProtocols(
      (protocolsResult.data as SupplementProtocolRow[]).map((protocol) => ({
        ...protocol,
        dose_amount: Number(protocol.dose_amount),
      })),
    );
    setLogs(
      (logsResult.data as SupplementLogRow[]).map((log) => ({
        ...log,
        dose_amount: Number(log.dose_amount),
      })),
    );
    setIsLoading(false);
  }, [logDate]);

  useFocusEffect(
    useCallback(() => {
      void loadSupplements();
    }, [loadSupplements]),
  );

  const latestLogByProtocolSlot = useMemo(() => {
    const latestLogs = new Map<string, SupplementLog>();

    for (const log of logs) {
      latestLogs.set(
        getSupplementLogKey(log.protocol_id, log.dose_slot),
        log,
      );
    }

    return latestLogs;
  }, [logs]);

  return {
    errorMessage,
    isLoading,
    latestLogByProtocolSlot,
    logs,
    protocols,
    refreshSupplements: loadSupplements,
  };
}
