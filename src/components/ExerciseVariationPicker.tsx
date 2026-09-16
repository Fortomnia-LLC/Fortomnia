import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import type { ExerciseVariation } from "../lib/exerciseVariations";

type ExerciseVariationPickerProps = {
  isLoading: boolean;
  onSelect: (variationId: string) => void;
  selectedVariationId: string | null;
  variations: ExerciseVariation[];
};

export function ExerciseVariationPicker({
  isLoading,
  onSelect,
  selectedVariationId,
  variations,
}: ExerciseVariationPickerProps) {
  if (isLoading) {
    return <ActivityIndicator color="#F97316" size="small" />;
  }

  if (variations.length === 0) return null;

  return (
    <View style={styles.list}>
      {variations.map((variation) => {
        const selected = variation.id === selectedVariationId;
        const details = [
          variation.attachment,
          variation.grip,
          variation.stance,
          variation.laterality,
          variation.execution_style,
        ].filter((value): value is string => Boolean(value));

        return (
          <Pressable
            accessibilityHint="Uses this variation for performance history and recommendations"
            accessibilityLabel={`${variation.name}${details.length ? `, ${details.join(", ")}` : ""}`}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={variation.id}
            onPress={() => onSelect(variation.id)}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <Text style={[styles.name, selected && styles.nameSelected]}>
              {variation.name}
            </Text>
            {details.length ? (
              <Text style={styles.details}>{details.join(" • ")}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  option: {
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 10,
    borderWidth: 1,
    padding: 13,
  },
  optionSelected: { backgroundColor: "#2A180B", borderColor: "#F97316" },
  name: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  nameSelected: { color: "#FDBA74" },
  details: { color: "#9CA3AF", fontSize: 12, marginTop: 5, textTransform: "capitalize" },
});
