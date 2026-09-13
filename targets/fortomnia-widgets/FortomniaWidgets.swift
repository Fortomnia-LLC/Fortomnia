import SwiftUI
import WidgetKit

private let appGroup = "group.com.grc0830source.fortomnia.widgets"
private let snapshotKey = "fortomniaWidgetSnapshot"

struct FortomniaSnapshot: Codable {
  let activeWorkoutId: String
  let activeWorkoutName: String
  let activeWorkoutSets: Int
  let healthLastSyncedAt: String
  let updatedAt: String

  static let empty = FortomniaSnapshot(
    activeWorkoutId: "", activeWorkoutName: "", activeWorkoutSets: 0,
    healthLastSyncedAt: "", updatedAt: ""
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

  var body: some View {
    if family == .accessoryRectangular {
      VStack(alignment: .leading, spacing: 2) {
        Text(entry.snapshot.activeWorkoutName.isEmpty ? "Fortomnia" : entry.snapshot.activeWorkoutName)
          .font(.headline).lineLimit(1)
        Text(entry.snapshot.activeWorkoutName.isEmpty ? healthLabel : "\(entry.snapshot.activeWorkoutSets) sets logged")
          .font(.caption).privacySensitive()
      }
      .widgetURL(URL(string: entry.snapshot.activeWorkoutName.isEmpty ? "fortomnia://health-recovery" : "fortomnia://workout/\(entry.snapshot.activeWorkoutId)"))
    } else {
      VStack(alignment: .leading, spacing: 8) {
        Label("FORTOMNIA", systemImage: "bolt.heart.fill")
          .font(.caption.bold()).foregroundStyle(.orange)
        Spacer()
        Text(entry.snapshot.activeWorkoutName.isEmpty ? "Ready when you are" : entry.snapshot.activeWorkoutName)
          .font(.headline).lineLimit(2)
        Text(entry.snapshot.activeWorkoutName.isEmpty ? healthLabel : "\(entry.snapshot.activeWorkoutSets) sets logged")
          .font(.caption).foregroundStyle(.secondary).privacySensitive()
      }
      .widgetURL(URL(string: entry.snapshot.activeWorkoutName.isEmpty ? "fortomnia://health-recovery" : "fortomnia://workout/\(entry.snapshot.activeWorkoutId)"))
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
