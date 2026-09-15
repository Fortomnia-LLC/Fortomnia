import ActivityKit
import ExpoModulesCore

@available(iOS 16.2, *)
struct FortomniaWorkoutAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    let workoutName: String
    let currentExerciseName: String
    let completedSets: Int
    let totalSets: Int
    let restEndsAt: Date?
  }

  let workoutId: String
}

public class FortomniaLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FortomniaLiveActivity")

    Function("isAvailable") {
      guard #available(iOS 16.2, *) else { return false }
      return ActivityAuthorizationInfo().areActivitiesEnabled
    }

    AsyncFunction("syncWorkout") {
      (
        workoutId: String,
        workoutName: String,
        currentExerciseName: String,
        completedSets: Int,
        totalSets: Int,
        restEndsAt: String?
      ) async throws -> Bool in
      guard #available(iOS 16.2, *) else { return false }
      guard ActivityAuthorizationInfo().areActivitiesEnabled else { return false }

      let state = FortomniaWorkoutAttributes.ContentState(
        workoutName: workoutName,
        currentExerciseName: currentExerciseName,
        completedSets: max(0, completedSets),
        totalSets: max(0, totalSets),
        restEndsAt: restEndsAt.flatMap(self.date)
      )
      let content = ActivityContent(state: state, staleDate: nil)

      if let activity = Activity<FortomniaWorkoutAttributes>.activities.first(
        where: { $0.attributes.workoutId == workoutId }
      ) {
        await activity.update(content)
      } else {
        _ = try Activity.request(
          attributes: FortomniaWorkoutAttributes(workoutId: workoutId),
          content: content,
          pushType: nil
        )
      }
      return true
    }

    AsyncFunction("endWorkout") { (workoutId: String) async -> Void in
      guard #available(iOS 16.2, *) else { return }
      let activities = Activity<FortomniaWorkoutAttributes>.activities.filter {
        $0.attributes.workoutId == workoutId
      }
      for activity in activities {
        await activity.end(nil, dismissalPolicy: .default)
      }
    }
  }

  private func date(_ value: String) -> Date? {
    let fractional = ISO8601DateFormatter()
    fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return fractional.date(from: value) ?? ISO8601DateFormatter().date(from: value)
  }
}
