import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getSupplementLogKey,
  type SupplementDoseSlot,
  type SupplementLog,
  type SupplementProtocol,
  useSupplements,
} from "../hooks/useSupplements";
import { getLocalDateKey } from "../lib/dates";
import {
  formatScheduledDays,
  getSupplementDoseSchedules,
  isProtocolAvailable,
  isProtocolDue,
} from "../lib/supplementSchedule";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

type ProtocolCardProps = {
  isAvailable: boolean;
  isLogging: (slot: SupplementDoseSlot) => boolean;
  logs: Map<string, SupplementLog>;
  onDelete: (protocol: SupplementProtocol) => void;
  onEdit: (protocol: SupplementProtocol) => void;
  onLog: (
    protocol: SupplementProtocol,
    slot: SupplementDoseSlot,
    status: "taken" | "skipped",
  ) => void;
  onToggleActive: (protocol: SupplementProtocol) => void;
  protocol: SupplementProtocol;
};

function ProtocolCard({
  isAvailable,
  isLogging,
  logs,
  onDelete,
  onEdit,
  onLog,
  onToggleActive,
  protocol,
}: ProtocolCardProps) {
  const schedules = getSupplementDoseSchedules(protocol);
  const takenCount = schedules.filter(
    ({ slot }) =>
      logs.get(getSupplementLogKey(protocol.id, slot))?.status === "taken",
  ).length;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleGroup}>
          <Text style={styles.protocolName}>{protocol.name}</Text>
          <Text style={styles.category}>
            {protocol.category.toUpperCase()}
          </Text>
        </View>
        <Text
          style={[
            styles.status,
            !protocol.is_active || !isAvailable
              ? styles.notDueStatus
              : takenCount === schedules.length
                ? styles.takenStatus
                : styles.pendingStatus,
          ]}
        >
          {!protocol.is_active
            ? "INACTIVE"
            : !isAvailable
              ? "NOT DUE"
              : `${takenCount}/${schedules.length} TAKEN`}
        </Text>
      </View>

      <Text style={styles.dose}>
        {protocol.dose_amount} {protocol.dose_unit} • {protocol.route}
      </Text>
      <Text style={styles.schedule}>
        {protocol.frequency === "selected_days"
          ? formatScheduledDays(protocol.scheduled_days)
          : protocol.frequency.replaceAll("_", " ")}
        {protocol.doses_per_day === 2 ? " • twice daily" : ""}
      </Text>

      {protocol.is_active && isAvailable
        ? schedules.map(({ label, slot, time }) => {
            const log = logs.get(getSupplementLogKey(protocol.id, slot));
            const logging = isLogging(slot);

            return (
              <View key={slot} style={styles.doseSlot}>
                <View style={styles.doseSlotHeader}>
                  <Text style={styles.doseSlotTitle}>{label}</Text>
                  <Text
                    style={[
                      styles.doseSlotStatus,
                      log?.status === "taken"
                        ? styles.takenStatus
                        : log?.status === "skipped"
                          ? styles.skippedStatus
                          : styles.pendingStatus,
                    ]}
                  >
                    {log?.status.toUpperCase() ?? "PENDING"}
                  </Text>
                </View>
                {time ? (
                  <Text style={styles.doseSlotTime}>{time.slice(0, 5)}</Text>
                ) : null}
                <View style={styles.actions}>
                  <Pressable
                    accessibilityLabel={`Mark ${protocol.name} ${label.toLowerCase()} taken`}
                    accessibilityRole="button"
                    accessibilityState={{
                      busy: logging,
                      disabled: logging || log?.status === "taken",
                    }}
                    disabled={logging || log?.status === "taken"}
                    onPress={() => onLog(protocol, slot, "taken")}
                    style={[
                      styles.takenButton,
                      (logging || log?.status === "taken") && styles.disabled,
                    ]}
                  >
                    <Text style={styles.takenButtonText}>Mark taken</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Skip ${protocol.name} ${label.toLowerCase()}`}
                    accessibilityRole="button"
                    accessibilityState={{
                      busy: logging,
                      disabled: logging || log?.status === "skipped",
                    }}
                    disabled={logging || log?.status === "skipped"}
                    onPress={() => onLog(protocol, slot, "skipped")}
                    style={[
                      styles.skippedButton,
                      (logging || log?.status === "skipped") && styles.disabled,
                    ]}
                  >
                    <Text style={styles.skippedButtonText}>Skip</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        : null}

      <Pressable onPress={() => onEdit(protocol)} style={styles.editButton}>
        <Text style={styles.editButtonText}>Edit protocol</Text>
      </Pressable>
      <Pressable
        onPress={() => onToggleActive(protocol)}
        style={styles.toggleButton}
      >
        <Text style={styles.toggleButtonText}>
          {protocol.is_active ? "Deactivate" : "Reactivate"}
        </Text>
      </Pressable>
      {!protocol.is_active ? (
        <Pressable onPress={() => onDelete(protocol)} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete permanently</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function shiftDate(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);
  return getLocalDateKey(date);
}

export default function SupplementsScreen() {
  const router = useRouter();
  const today = getLocalDateKey();
  const [selectedDate, setSelectedDate] = useState(today);
  const [loggingKey, setLoggingKey] = useState<string | null>(null);
  const { session } = useAuth();
  const {
    errorMessage,
    isLoading,
    latestLogByProtocolSlot,
    protocols,
    refreshSupplements,
  } = useSupplements(selectedDate);
  const isToday = selectedDate === today;
  const activeProtocols = protocols.filter((protocol) => protocol.is_active);
  const scheduledProtocols = activeProtocols.filter((protocol) =>
    isProtocolDue(protocol, selectedDate),
  );
  const scheduledDoseCount = scheduledProtocols.reduce(
    (total, protocol) =>
      total + getSupplementDoseSchedules(protocol).length,
    0,
  );
  const takenCount = scheduledProtocols.reduce(
    (total, protocol) =>
      total +
      getSupplementDoseSchedules(protocol).filter(
        ({ slot }) =>
          latestLogByProtocolSlot.get(
            getSupplementLogKey(protocol.id, slot),
          )?.status === "taken",
      ).length,
    0,
  );

  function handleEditProtocol(protocol: SupplementProtocol) {
    router.push({
      pathname: "/new-supplement",
      params: {
        category: protocol.category,
        doseAmount: String(protocol.dose_amount),
        doseUnit: protocol.dose_unit,
        dosesPerDay: String(protocol.doses_per_day),
        endDate: protocol.end_date ?? "",
        frequency: protocol.frequency,
        name: protocol.name,
        notes: protocol.notes ?? "",
        protocolId: protocol.id,
        route: protocol.route,
        scheduledDays: protocol.scheduled_days.join(","),
        scheduledTime: protocol.scheduled_time?.slice(0, 5) ?? "",
        secondScheduledTime:
          protocol.second_scheduled_time?.slice(0, 5) ?? "",
        startDate: protocol.start_date,
      },
    });
  }

  function handleDeleteProtocol(protocol: SupplementProtocol) {
    if (!session?.user.id) {
      Alert.alert("Unable to delete protocol", "Your user session is missing.");
      return;
    }
    if (protocol.is_active) {
      Alert.alert(
        "Deactivate protocol first",
        "Only inactive protocols can be permanently deleted.",
      );
      return;
    }

    Alert.alert(
      "Delete supplement permanently?",
      `${protocol.name} and all of its adherence history will be permanently deleted. This cannot be undone.`,
      [
        { style: "cancel", text: "Cancel" },
        {
          style: "destructive",
          text: "Delete permanently",
          onPress: async () => {
            const { data, error } = await supabase
              .from("supplement_protocols")
              .delete()
              .eq("id", protocol.id)
              .eq("user_id", session.user.id)
              .select("id")
              .maybeSingle();

            if (error || !data) {
              Alert.alert(
                "Unable to delete protocol",
                error?.message ?? "The protocol was not deleted.",
              );
              return;
            }
            await refreshSupplements();
          },
        },
      ],
    );
  }

  function handleToggleActive(protocol: SupplementProtocol) {
    if (!session?.user.id) {
      Alert.alert("Unable to update protocol", "Your user session is missing.");
      return;
    }
    const nextActiveState = !protocol.is_active;

    Alert.alert(
      nextActiveState ? "Reactivate protocol?" : "Deactivate protocol?",
      nextActiveState
        ? `${protocol.name} will return to your daily tracking list.`
        : `${protocol.name} will be hidden from daily adherence actions. Its history will be preserved.`,
      [
        { style: "cancel", text: "Cancel" },
        {
          text: nextActiveState ? "Reactivate" : "Deactivate",
          onPress: async () => {
            const { data, error } = await supabase
              .from("supplement_protocols")
              .update({
                is_active: nextActiveState,
                updated_at: new Date().toISOString(),
              })
              .eq("id", protocol.id)
              .eq("user_id", session.user.id)
              .select("id")
              .maybeSingle();

            if (error || !data) {
              Alert.alert(
                "Unable to update protocol",
                error?.message ?? "The protocol was not updated.",
              );
              return;
            }
            await refreshSupplements();
          },
        },
      ],
    );
  }

  async function handleLog(
    protocol: SupplementProtocol,
    doseSlot: SupplementDoseSlot,
    status: "taken" | "skipped",
  ) {
    if (!session?.user.id) {
      Alert.alert("Unable to update supplement", "Your user session is missing.");
      return;
    }

    const key = getSupplementLogKey(protocol.id, doseSlot);
    if (loggingKey !== null) return;
    setLoggingKey(key);

    try {
      const existingLog = latestLogByProtocolSlot.get(key);
      const values = {
        completed_at: new Date().toISOString(),
        dose_amount: protocol.dose_amount,
        dose_slot: doseSlot,
        dose_unit: protocol.dose_unit,
        status,
      };

      if (existingLog) {
        const { data, error } = await supabase
          .from("supplement_logs")
          .update(values)
          .eq("id", existingLog.id)
          .eq("user_id", session.user.id)
          .select("id")
          .maybeSingle();

        if (error || !data) {
          Alert.alert(
            "Unable to update supplement",
            error?.message ?? "The adherence log was not updated.",
          );
          return;
        }
      } else {
        const { error } = await supabase.from("supplement_logs").insert({
          ...values,
          log_date: selectedDate,
          protocol_id: protocol.id,
          user_id: session.user.id,
        });

        if (error) {
          Alert.alert("Unable to update supplement", error.message);
          return;
        }
      }

      await refreshSupplements();
    } finally {
      setLoggingKey(null);
    }
  }

  if (isLoading && protocols.length === 0) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#2563EB" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={protocols}
        keyExtractor={(protocol) => protocol.id}
        onRefresh={() => void refreshSupplements()}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <ProtocolCard
            isAvailable={isProtocolAvailable(item, selectedDate)}
            isLogging={(slot) =>
              loggingKey === getSupplementLogKey(item.id, slot)
            }
            logs={latestLogByProtocolSlot}
            onDelete={handleDeleteProtocol}
            onEdit={handleEditProtocol}
            onLog={handleLog}
            onToggleActive={handleToggleActive}
            protocol={item}
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>FORTOMNIA</Text>
            <Text style={styles.title}>Supplements</Text>
            <Text style={styles.subtitle}>
              Private protocols and dose-by-dose adherence.
            </Text>
            <Text style={styles.date}>
              {new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
                undefined,
                { dateStyle: "full" },
              )}
            </Text>
            <View style={styles.dateNavigation}>
              <Pressable
                accessibilityLabel="View previous day"
                accessibilityRole="button"
                onPress={() =>
                  setSelectedDate((current) => shiftDate(current, -1))
                }
                style={styles.dateButton}
              >
                <Text style={styles.dateButtonText}>‹ Previous</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Return to today"
                accessibilityRole="button"
                accessibilityState={{ disabled: isToday }}
                disabled={isToday}
                onPress={() => setSelectedDate(today)}
                style={[styles.todayButton, isToday && styles.disabled]}
              >
                <Text style={styles.todayButtonText}>Today</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="View next day"
                accessibilityRole="button"
                accessibilityState={{ disabled: isToday }}
                disabled={isToday}
                onPress={() =>
                  setSelectedDate((current) => shiftDate(current, 1))
                }
                style={[styles.dateButton, isToday && styles.disabled]}
              >
                <Text style={styles.dateButtonText}>Next ›</Text>
              </Pressable>
            </View>
            <View style={styles.summary}>
              <Text style={styles.summaryNumber}>
                {takenCount}/{scheduledDoseCount}
              </Text>
              <Text style={styles.summaryLabel}>scheduled doses taken</Text>
            </View>
            <Link href="/new-supplement" asChild>
              <Pressable style={styles.addButton}>
                <Text style={styles.addButtonText}>Add supplement</Text>
              </Pressable>
            </Link>
            {errorMessage ? (
              <Text
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
                style={styles.error}
              >
                {errorMessage}
              </Text>
            ) : null}
            <Text style={styles.sectionTitle}>
              {isToday ? "Today's protocols" : "Daily protocols"}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No active supplements</Text>
            <Text style={styles.emptyText}>
              Add your first supplement or protocol to begin tracking.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: "center",
    backgroundColor: "#0B0B0B",
    flex: 1,
    justifyContent: "center",
  },
  screen: { backgroundColor: "#0B0B0B", flex: 1 },
  listContent: { paddingBottom: 30, paddingHorizontal: 20 },
  header: { paddingTop: 24 },
  eyebrow: {
    color: "#60A5FA",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
  },
  title: { color: "#FFFFFF", fontSize: 36, fontWeight: "800", marginTop: 8 },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 15,
    marginBottom: 22,
    marginTop: 6,
  },
  date: { color: "#D1D5DB", fontSize: 15, marginBottom: 14 },
  dateNavigation: { flexDirection: "row", gap: 8, marginBottom: 20 },
  dateButton: {
    alignItems: "center",
    borderColor: "#374151",
    borderRadius: 9,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  dateButtonText: { color: "#D1D5DB", fontSize: 13, fontWeight: "700" },
  todayButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 9,
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  todayButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  summary: {
    alignItems: "center",
    backgroundColor: "#171717",
    borderColor: "#292929",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
    padding: 18,
  },
  summaryNumber: { color: "#60A5FA", fontSize: 28, fontWeight: "800" },
  summaryLabel: { color: "#D1D5DB", flex: 1, fontSize: 14 },
  addButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 12,
    justifyContent: "center",
    marginBottom: 24,
    minHeight: 52,
  },
  addButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  error: { color: "#F87171", marginBottom: 18 },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },
  card: {
    backgroundColor: "#171717",
    borderColor: "#292929",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    padding: 16,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardTitleGroup: { flex: 1, paddingRight: 12 },
  protocolName: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  category: {
    color: "#60A5FA",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 5,
  },
  status: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  takenStatus: { color: "#34D399" },
  skippedStatus: { color: "#F87171" },
  pendingStatus: { color: "#9CA3AF" },
  notDueStatus: { color: "#6B7280" },
  dose: {
    color: "#D1D5DB",
    fontSize: 15,
    marginTop: 12,
    textTransform: "capitalize",
  },
  schedule: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 6,
    textTransform: "capitalize",
  },
  doseSlot: {
    borderTopColor: "#303030",
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 14,
  },
  doseSlotHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  doseSlotTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  doseSlotStatus: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  doseSlotTime: { color: "#9CA3AF", fontSize: 13, marginTop: 4 },
  actions: { flexDirection: "row", gap: 10, marginTop: 10 },
  takenButton: {
    borderColor: "#34D399",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  takenButtonText: { color: "#34D399", fontSize: 13, fontWeight: "700" },
  skippedButton: {
    borderColor: "#F87171",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skippedButtonText: { color: "#F87171", fontSize: 13, fontWeight: "700" },
  editButton: {
    alignItems: "center",
    borderColor: "#2563EB",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  editButtonText: { color: "#60A5FA", fontSize: 13, fontWeight: "700" },
  toggleButton: {
    alignItems: "center",
    borderColor: "#6B7280",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  toggleButtonText: { color: "#D1D5DB", fontSize: 13, fontWeight: "700" },
  deleteButton: {
    alignItems: "center",
    borderColor: "#F87171",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  deleteButtonText: { color: "#F87171", fontSize: 13, fontWeight: "700" },
  disabled: { opacity: 0.35 },
  emptyCard: {
    backgroundColor: "#171717",
    borderColor: "#292929",
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
  },
  emptyTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  emptyText: { color: "#9CA3AF", fontSize: 14, marginTop: 8 },
});
