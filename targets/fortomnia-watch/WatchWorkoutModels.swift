import Foundation

struct WatchPlannedExercise: Codable, Identifiable, Equatable {
  let exerciseId: String
  let name: String
  let performanceType: String
  let position: Int
  let repMin: Int
  let repMax: Int
  let targetDurationSeconds: Int?
  let targetMetricValue: Double?
  let targetMetricUnit: String?
  let targetRir: Int?
  let targetSets: Int

  var id: String { exerciseId }
}

struct WatchWorkoutSnapshot: Codable, Equatable {
  let version: Int
  let sessionId: String
  let name: String
  let startedAt: String
  let exercises: [WatchPlannedExercise]
}

struct WatchSetPayload: Codable, Equatable {
  let exerciseId: String
  let setNumber: Int
  let performanceType: String
  let reps: Int?
  let weight: Double
  let weightUnit: String
  let rir: Int?
  let durationSeconds: Int?
  let metricValue: Double?
  let metricUnit: String?
}

struct WatchWorkoutAction: Codable, Identifiable, Equatable {
  let version: Int
  let actionId: String
  let sessionId: String
  let createdAt: String
  let sequence: Int
  let kind: String
  let payload: WatchSetPayload

  var id: String { actionId }
}
