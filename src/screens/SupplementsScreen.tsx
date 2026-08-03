import { Link, useRouter } from "expo-router";
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

import { getLocalDateKey } from "../hooks/useDailyNutrition";
import {
  type SupplementLog,
  type SupplementProtocol,
  useSupplements,
} from "../hooks/useSupplements";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import { useState } from "react";
type ProtocolCardProps = {
  log: SupplementLog | undefined;
  onDelete: (protocol: SupplementProtocol) => void;
  onEdit: (protocol: SupplementProtocol) => void;
  onLog: (
    protocol: SupplementProtocol,
    status: "taken" | "skipped",
  ) => void;
  onToggleActive: (protocol: SupplementProtocol) => void;
  protocol: SupplementProtocol;
};

function ProtocolCard({
  log,
  onDelete,
  onEdit,
  onLog,
  onToggleActive,
  protocol,
}: ProtocolCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleGroup}>
          <Text style={styles.protocolName}>{protocol.name}</Text>
          <Text style={styles.category}>
            {protocol.category.toUpperCase()}
          </Text>
        </View>

        {!protocol.is_active ? (
          <Text style={[styles.status, styles.inactiveStatus]}>
            INACTIVE
          </Text>
        ) : log ? (
          <Text
            style={[
              styles.status,
              log.status === "taken"
                ? styles.takenStatus
                : styles.skippedStatus,
            ]}
          >
            {log.status.toUpperCase()}
          </Text>
        ) : (
          <Text style={[styles.status, styles.pendingStatus]}>
            PENDING
          </Text>
        )}
      </View>

      <Text style={styles.dose}>
        {protocol.dose_amount} {protocol.dose_unit} • {protocol.route}
      </Text>

      <Text style={styles.schedule}>
        {protocol.frequency.replace("_", " ")}
        {protocol.scheduled_time
          ? ` • ${protocol.scheduled_time.slice(0, 5)}`
          : ""}
      </Text>

      {protocol.is_active ? (
        <View style={styles.actions}>
          <Pressable
            disabled={log?.status === "taken"}
            onPress={() => onLog(protocol, "taken")}
            style={[
              styles.takenButton,
              log?.status === "taken" && styles.disabled,
            ]}
          >
            <Text style={styles.takenButtonText}>Mark taken</Text>
          </Pressable>

          <Pressable
            disabled={log?.status === "skipped"}
            onPress={() => onLog(protocol, "skipped")}
            style={[
              styles.skippedButton,
              log?.status === "skipped" && styles.disabled,
            ]}
          >
            <Text style={styles.skippedButtonText}>Skip</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        onPress={() => onEdit(protocol)}
        style={styles.editButton}
      >
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
        <Pressable
          onPress={() => onDelete(protocol)}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>
            Delete permanently
          </Text>
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
const isToday = selectedDate === today;
const { session } = useAuth();
  const {
    errorMessage,
    isLoading,
    latestLogByProtocol,
    protocols,
    refreshSupplements,
  } = useSupplements(selectedDate);

  const activeProtocols = protocols.filter(
    (protocol) => protocol.is_active,
  );
  const takenCount = activeProtocols.filter(
    (protocol) =>
      latestLogByProtocol.get(protocol.id)?.status === "taken",
  ).length;
  function handleEditProtocol(protocol: SupplementProtocol) {
    router.push({
      pathname: "/new-supplement",
      params: {
        category: protocol.category,
        doseAmount: String(protocol.dose_amount),
        doseUnit: protocol.dose_unit,
        frequency: protocol.frequency,
        name: protocol.name,
        notes: protocol.notes ?? "",
        protocolId: protocol.id,
        route: protocol.route,
        scheduledTime: protocol.scheduled_time?.slice(0, 5) ?? "",
      },
    });
  }
  function handleDeleteProtocol(protocol: SupplementProtocol) {
    if (!session?.user.id) {
      Alert.alert(
        "Unable to delete protocol",
        "Your user session is missing.",
      );
      return;
    }

    if (protocol.is_active) {
      Alert.alert(
        "Deactivate protocol first",
        "Only inactive protocols can be permanently deleted.",
      );
      return;
    }

    const userId = session.user.id;

    Alert.alert(
      "Delete supplement permanently?",
      `${protocol.name} and all of its adherence history will be permanently deleted. This cannot be undone.`,
      [
        {
          style: "cancel",
          text: "Cancel",
        },
        {
          style: "destructive",
          text: "Delete permanently",
          onPress: async () => {
            const { data, error } = await supabase
              .from("supplement_protocols")
              .delete()
              .eq("id", protocol.id)
              .eq("user_id", userId)
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
      Alert.alert(
        "Unable to update protocol",
        "Your user session is missing.",
      );
      return;
    }

    const nextActiveState = !protocol.is_active;
    const userId = session.user.id;

    Alert.alert(
      nextActiveState ? "Reactivate protocol?" : "Deactivate protocol?",
      nextActiveState
        ? `${protocol.name} will return to your daily tracking list.`
        : `${protocol.name} will be hidden from daily adherence actions. Its history will be preserved.`,
      [
        {
          style: "cancel",
          text: "Cancel",
        },
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
              .eq("user_id", userId)
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
    status: "taken" | "skipped",
  ) {
    if (!session?.user.id) {
      Alert.alert(
        "Unable to update supplement",
        "Your user session is missing.",
      );
      return;
    }

    const existingLog = latestLogByProtocol.get(protocol.id);
    const values = {
      completed_at: new Date().toISOString(),
      dose_amount: protocol.dose_amount,
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
      const { error } = await supabase
        .from("supplement_logs")
        .insert({
          ...values,
          log_date:selectedDate,
          protocol_id: protocol.id,
          user_id: session.user.id,
        });

      if (error) {
        Alert.alert("Unable to update supplement", error.message);
        return;
      }
    }

    await refreshSupplements();
  }

  if (isLoading && protocols.length === 0) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#F97316" size="large" />
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
            log={latestLogByProtocol.get(item.id)}
            onDelete={handleDeleteProtocol}
            onEdit={handleEditProtocol}
            onLog={handleLog}
            onToggleActive={handleToggleActive}
            protocol={item}
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>IRONFORGE</Text>
            <Text style={styles.title}>Supplements</Text>
            <Text style={styles.subtitle}>
              Private protocols and daily adherence.
            </Text>
<Text style={styles.date}>
  {new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
    undefined,
    {
      dateStyle: "full",
    },
  )}
</Text>

<View style={styles.dateNavigation}>
  <Pressable
    onPress={() =>
      setSelectedDate((current) => shiftDate(current, -1))
    }
    style={styles.dateButton}
  >
    <Text style={styles.dateButtonText}>‹ Previous</Text>
  </Pressable>

  <Pressable
    disabled={isToday}
    onPress={() => setSelectedDate(today)}
    style={[
      styles.todayButton,
      isToday && styles.dateButtonDisabled,
    ]}
  >
    <Text style={styles.todayButtonText}>Today</Text>
  </Pressable>

  <Pressable
    disabled={isToday}
    onPress={() =>
      setSelectedDate((current) => shiftDate(current, 1))
    }
    style={[
      styles.dateButton,
      isToday && styles.dateButtonDisabled,
    ]}
  >
    <Text style={styles.dateButtonText}>Next ›</Text>
  </Pressable>
</View>
            <View style={styles.summary}>
              <Text style={styles.summaryNumber}>
                {takenCount}/{activeProtocols.length}
              </Text>
              <Text style={styles.summaryLabel}>
                {isToday
  ? "active protocols taken today"
  : "active protocols taken this day"}
              </Text>
            </View>

            <Link href="/new-supplement" asChild>
              <Pressable style={styles.addButton}>
                <Text style={styles.addButtonText}>
                  Add supplement
                </Text>
              </Pressable>
            </Link>

            {errorMessage ? (
              <Text style={styles.error}>{errorMessage}</Text>
            ) : null}

            <Text style={styles.sectionTitle}>
              {isToday ? "Today's protocols" : "Daily protocols"}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              No active supplements
            </Text>
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
  screen: {
    backgroundColor: "#0B0B0B",
    flex: 1,
  },
  listContent: {
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 24,
  },
  eyebrow: {
    color: "#F97316",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
    marginTop: 8,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
    marginTop: 6,
  },
  date: {
    color: "#D1D5DB",
    fontSize: 15,
    marginBottom: 14,
  },
  dateNavigation: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  dateButton: {
    alignItems: "center",
    borderColor: "#374151",
    borderRadius: 9,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  dateButtonText: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "700",
  },
  todayButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 9,
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  todayButtonText: {
    color: "#0B0B0B",
    fontSize: 13,
    fontWeight: "800",
  },
  dateButtonDisabled: {
    opacity: 0.35,
  },
  summary: {
    alignItems: "baseline",
    backgroundColor: "#1A1A1A",
    borderColor: "#2A2A2A",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
    padding: 18,
  },
  summaryNumber: {
    color: "#F97316",
    fontSize: 28,
    fontWeight: "800",
  },
  summaryLabel: {
    color: "#D1D5DB",
    flex: 1,
    fontSize: 14,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 12,
    justifyContent: "center",
    marginBottom: 24,
    minHeight: 52,
  },
  addButtonText: {
    color: "#0B0B0B",
    fontSize: 16,
    fontWeight: "800",
  },
  error: {
    color: "#F87171",
    marginBottom: 18,
  },
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
  cardTitleGroup: {
    flex: 1,
    paddingRight: 12,
  },
  protocolName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  category: {
    color: "#F97316",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 5,
  },
  status: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  takenStatus: {
    color: "#34D399",
  },
  skippedStatus: {
    color: "#F87171",
  },
  pendingStatus: {
    color: "#9CA3AF",
  },
  inactiveStatus: {
    color: "#6B7280",
  },
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
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  takenButton: {
    borderColor: "#34D399",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  takenButtonText: {
    color: "#34D399",
    fontSize: 13,
    fontWeight: "700",
  },
  skippedButton: {
    borderColor: "#F87171",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skippedButtonText: {
    color: "#F87171",
    fontSize: 13,
    fontWeight: "700",
  },
  editButton: {
    alignItems: "center",
    borderColor: "#F97316",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  editButtonText: {
    color: "#F97316",
    fontSize: 13,
    fontWeight: "700",
  },
  toggleButton: {
    alignItems: "center",
    borderColor: "#6B7280",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  toggleButtonText: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "700",
  },
  deleteButton: {
    alignItems: "center",
    borderColor: "#F87171",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  deleteButtonText: {
    color: "#F87171",
    fontSize: 13,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.35,
  },
  emptyCard: {
    backgroundColor: "#171717",
    borderColor: "#292929",
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
});
