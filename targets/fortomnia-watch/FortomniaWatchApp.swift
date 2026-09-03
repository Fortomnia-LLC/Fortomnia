import SwiftUI

@main
struct FortomniaWatchApp: App {
  @StateObject private var workoutStore = WatchWorkoutStore()

  var body: some Scene {
    WindowGroup {
      RootWorkoutView()
        .environmentObject(workoutStore)
        .tint(Color(red: 1, green: 0.42, blue: 0.21))
    }
  }
}
