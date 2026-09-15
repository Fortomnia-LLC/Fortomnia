import SwiftUI
import WidgetKit

private let appGroup = "group.com.grc0830source.fortomnia.widgets"
private let snapshotKey = "fortomniaWidgetSnapshot"

struct FortomniaSnapshot: Codable {
  let activeWorkoutId: String
  let activeWorkoutName: String
  let activeWorkoutSets: Int
  let activeWorkoutPlannedSets: Int?
  let healthLastSyncedAt: String
  let nextWorkoutExerciseCount: Int?
  let nextWorkoutId: String?
  let nextWorkoutLocationName: String?
  let nextWorkoutName: String?
  let updatedAt: String

  static let empty = FortomniaSnapshot(
    activeWorkoutId: "", activeWorkoutName: "", activeWorkoutSets: 0,
    activeWorkoutPlannedSets: 0, healthLastSyncedAt: "",
    nextWorkoutExerciseCount: 0, nextWorkoutId: "",
    nextWorkoutLocationName: "", nextWorkoutName: "", updatedAt: ""
  )
}

struct FortomniaEntry: TimelineEntry {
  let date: Date
  let snapshot: FortomniaSnapshot
}

struct FortomniaProvider: TimelineProvider {
  func placeholder(in context: Context) -> FortomniaEntry {
    FortomniaEntry(date: .now, snapshot: .empty)
  }

  func getSnapshot(in context: Context, completion: @escaping (FortomniaEntry) -> Void) {
    completion(FortomniaEntry(date: .now, snapshot: loadSnapshot()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<FortomniaEntry>) -> Void) {
    let entry = FortomniaEntry(date: .now, snapshot: loadSnapshot())
    completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(30 * 60))))
  }

  private func loadSnapshot() -> FortomniaSnapshot {
    guard
      let defaults = UserDefaults(suiteName: appGroup),
      let object = defaults.dictionary(forKey: snapshotKey),
      JSONSerialization.isValidJSONObject(object),
      let data = try? JSONSerialization.data(withJSONObject: object),
      let snapshot = try? JSONDecoder().decode(FortomniaSnapshot.self, from: data)
    else { return .empty }
    return snapshot
  }
}

struct FortomniaStatusView: View {
  @Environment(\.widgetFamily) private var family
  let entry: FortomniaEntry

  private var healthLabel: String {
    guard !entry.snapshot.healthLastSyncedAt.isEmpty else { return "Health not synced" }
    return "Health updated"
  }

  private var hasActiveWorkout: Bool {
    !entry.snapshot.activeWorkoutName.isEmpty
  }

  private var nextWorkoutName: String {
    entry.snapshot.nextWorkoutName ?? ""
  }

  private var hasNextWorkout: Bool {
    !nextWorkoutName.isEmpty
  }

  private var destination: URL? {
    if hasActiveWorkout {
      return URL(string: "fortomnia://workout/\(entry.snapshot.activeWorkoutId)")
    }
    if hasNextWorkout, let id = entry.snapshot.nextWorkoutId, !id.isEmpty {
      return URL(string: "fortomnia://template/\(id)")
    }
    return URL(string: "fortomnia://health-recovery")
  }

  private var workoutProgressLabel: String {
    let planned = entry.snapshot.activeWorkoutPlannedSets ?? 0
    return planned > 0
      ? "\(entry.snapshot.activeWorkoutSets) of \(planned) sets"
      : "\(entry.snapshot.activeWorkoutSets) sets logged"
  }

  private var nextWorkoutDetail: String {
    let count = entry.snapshot.nextWorkoutExerciseCount ?? 0
    let location = entry.snapshot.nextWorkoutLocationName ?? ""
    let exerciseLabel = count == 1 ? "1 exercise" : "\(count) exercises"
    if !location.isEmpty && count > 0 { return "\(exerciseLabel) • \(location)" }
    if !location.isEmpty { return location }
    if count > 0 { return exerciseLabel }
    return "Workout ready"
  }

  var body: some View {
    if family == .accessoryRectangular {
      VStack(alignment: .leading, spacing: 2) {
        Text(hasActiveWorkout ? entry.snapshot.activeWorkoutName : (hasNextWorkout ? nextWorkoutName : "Fortomnia"))
          .font(.headline).lineLimit(1)
        Text(hasActiveWorkout ? workoutProgressLabel : (hasNextWorkout ? nextWorkoutDetail : healthLabel))
          .font(.caption).privacySensitive()
      }
      .widgetURL(destination)
    } else {
      VStack(alignment: .leading, spacing: 8) {
        Label("FORTOMNIA", systemImage: "bolt.heart.fill")
          .font(.caption.bold()).foregroundStyle(.orange)
        Spacer()
        Text(hasActiveWorkout ? entry.snapshot.activeWorkoutName : (hasNextWorkout ? nextWorkoutName : "Ready when you are"))
          .font(.headline).lineLimit(2)
        Text(hasActiveWorkout ? workoutProgressLabel : (hasNextWorkout ? nextWorkoutDetail : healthLabel))
          .font(.caption).foregroundStyle(.secondary).privacySensitive()
      }
      .widgetURL(destination)
      .containerBackground(Color(red: 0.043, green: 0.043, blue: 0.043), for: .widget)
    }
  }
}

struct FortomniaStatusWidget: Widget {
  let kind = "FortomniaStatusWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: FortomniaProvider()) { entry in
      FortomniaStatusView(entry: entry)
    }
    .configurationDisplayName("Fortomnia Status")
    .description("See workout progress and health-sync freshness.")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular])
  }
}

@main
struct FortomniaWidgetBundle: WidgetBundle {
  var body: some Widget { FortomniaStatusWidget() }
}
