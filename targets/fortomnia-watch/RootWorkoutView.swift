import Foundation
import SwiftUI

struct RootWorkoutView: View {
  @EnvironmentObject private var store: WatchWorkoutStore

  var body: some View {
    NavigationStack {
      Group {
        if store.snapshot == nil {
          ContentUnavailableView(
            "No Workout",
            systemImage: "iphone.and.arrow.forward",
            description: Text("Start a Fortomnia workout on your iPhone.")
          )
        } else {
          ActiveWorkoutView()
        }
      }
      .toolbar {
        ToolbarItem(placement: .topBarTrailing) {
          Circle()
            .fill(store.isReachable ? Color.green : Color.orange)
            .frame(width: 8, height: 8)
            .accessibilityLabel(store.syncLabel)
        }
      }
    }
  }
}

private struct ActiveWorkoutView: View {
  @EnvironmentObject private var store: WatchWorkoutStore

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 10) {
        if let workout = store.snapshot, let exercise = store.currentExercise {
          Text(workout.name.uppercased())
            .font(.caption2.weight(.semibold))
            .foregroundStyle(.secondary)

          Text(exercise.name)
            .font(.headline)
            .lineLimit(2)

          Text("Set \(store.completedSetsForCurrentExercise + 1) of \(exercise.targetSets)")
            .font(.caption)
            .foregroundStyle(.secondary)

          if exercise.performanceType == "reps" {
            ValueControl(title: "REPS", value: store.reps, range: 1...100) { store.reps = $0 }
            LoadControl(value: store.weight) { store.weight = $0 }
            ValueControl(title: "RIR", value: store.rir, range: 0...10) { store.rir = $0 }
          } else {
            Text(targetText(exercise))
              .font(.title3.monospacedDigit().weight(.bold))
          }

          Button {
            store.logCurrentSet()
          } label: {
            Label("Log Set", systemImage: "checkmark.circle.fill")
              .frame(maxWidth: .infinity, minHeight: 36)
          }
          .buttonStyle(.borderedProminent)

          HStack {
            Button("Back") { store.selectExercise(max(0, store.exerciseIndex - 1)) }
              .disabled(store.exerciseIndex == 0)
            Button("Next") { store.selectExercise(store.exerciseIndex + 1) }
              .disabled(store.exerciseIndex + 1 >= workout.exercises.count)
          }

          if !store.pendingActions.isEmpty {
            Button("Undo last set", role: .destructive) { store.undoLastPendingSet() }
              .font(.caption)
          }

          Text("\(store.syncLabel) · \(store.pendingActions.count) pending")
            .font(.caption2)
            .foregroundStyle(.secondary)
        }
      }
      .padding(.horizontal, 4)
    }
    .navigationTitle("Workout")
  }

  private func targetText(_ exercise: WatchPlannedExercise) -> String {
    if exercise.performanceType == "time" { return "\(exercise.targetDurationSeconds ?? 30) sec" }
    return "\(String(format: "%.1f", exercise.targetMetricValue ?? 1)) \(exercise.targetMetricUnit ?? "")"
  }
}

private struct ValueControl: View {
  let title: String
  let value: Int
  let range: ClosedRange<Int>
  let update: (Int) -> Void

  var body: some View {
    HStack {
      Text(title).font(.caption2).foregroundStyle(.secondary)
      Button { update(max(range.lowerBound, value - 1)) } label: { Image(systemName: "minus") }
      Text("\(value)").font(.title3.monospacedDigit().weight(.bold)).frame(minWidth: 30)
      Button { update(min(range.upperBound, value + 1)) } label: { Image(systemName: "plus") }
    }
    .buttonStyle(.borderless)
  }
}

private struct LoadControl: View {
  let value: Double
  let update: (Double) -> Void

  var body: some View {
    HStack {
      Text("LB").font(.caption2).foregroundStyle(.secondary)
      Button { update(max(0, value - 5)) } label: { Image(systemName: "minus") }
      Text(value.formatted(.number.precision(.fractionLength(0...1))))
        .font(.title3.monospacedDigit().weight(.bold)).frame(minWidth: 42)
      Button { update(value + 5) } label: { Image(systemName: "plus") }
    }
    .buttonStyle(.borderless)
  }
}
