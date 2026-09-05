import Foundation
import WatchConnectivity
import WatchKit

@MainActor
final class WatchWorkoutStore: NSObject, ObservableObject {
  @Published private(set) var snapshot: WatchWorkoutSnapshot?
  @Published private(set) var pendingActions: [WatchWorkoutAction] = []
  @Published private(set) var completedSetCounts: [String: Int] = [:]
  @Published private(set) var isReachable = false
  @Published private(set) var lastSyncError: String?
  @Published var exerciseIndex = 0
  @Published var reps = 8
  @Published var weight = 0.0
  @Published var rir = 2

  private let snapshotKey = "fortomnia.workout.snapshot.v1"
  private let actionsKey = "fortomnia.workout.actions.v1"
  private let acknowledgementsKey = "fortomnia.workout.acknowledgements.v1"
  private let clearWorkoutKey = "fortomnia.workout.clear.v1"
  private let storedSnapshotKey = "fortomnia.watch.snapshot.v1"
  private let storedActionsKey = "fortomnia.watch.pending-actions.v1"
  private let storedSetCountsKey = "fortomnia.watch.completed-set-counts.v1"
  private let encoder = JSONEncoder()
  private let decoder = JSONDecoder()
  private let defaults: UserDefaults
  private var session: WCSession?

  override init() {
    defaults = .standard
    super.init()
    restore()
    activateConnectivity()
    loadExerciseDefaults()
  }

  var currentExercise: WatchPlannedExercise? {
    guard let exercises = snapshot?.exercises, exercises.indices.contains(exerciseIndex) else { return nil }
    return exercises[exerciseIndex]
  }

  var completedSetsForCurrentExercise: Int {
    guard let exercise = currentExercise else { return 0 }
    return completedSetCounts[exercise.exerciseId] ?? 0
  }

  var syncLabel: String {
    if !pendingActions.isEmpty { return isReachable ? "Syncing" : "Saved offline" }
    return isReachable ? "Connected" : "Phone unavailable"
  }

  func logCurrentSet() {
    guard let snapshot, let exercise = currentExercise else { return }
    let performanceType = exercise.performanceType
    let nextSet = completedSetsForCurrentExercise + 1
    let payload = WatchSetPayload(
      exerciseId: exercise.exerciseId,
      setNumber: nextSet,
      performanceType: performanceType,
      reps: performanceType == "reps" ? max(1, reps) : nil,
      weight: max(0, weight),
      weightUnit: "lb",
      rir: performanceType == "reps" ? min(10, max(0, rir)) : nil,
      durationSeconds: performanceType == "time" ? max(1, exercise.targetDurationSeconds ?? 30) : nil,
      metricValue: ["distance", "calories", "rounds"].contains(performanceType)
        ? max(0, exercise.targetMetricValue ?? 1) : nil,
      metricUnit: ["distance", "calories", "rounds"].contains(performanceType)
        ? exercise.targetMetricUnit : nil
    )
    let action = WatchWorkoutAction(
      version: 1,
      actionId: UUID().uuidString,
      sessionId: snapshot.sessionId,
      createdAt: ISO8601DateFormatter().string(from: Date()),
      sequence: (pendingActions.map(\.sequence).max() ?? -1) + 1,
      kind: "log_set",
      payload: payload
    )
    pendingActions.append(action)
    completedSetCounts[exercise.exerciseId] = nextSet
    persistActions()
    sendPendingActions()
    WKInterfaceDevice.current().play(.success)

    if nextSet >= exercise.targetSets, exerciseIndex + 1 < snapshot.exercises.count {
      exerciseIndex += 1
      loadExerciseDefaults()
    }
  }

  func undoLastPendingSet() {
    guard let removed = pendingActions.popLast() else { return }
    completedSetCounts[removed.payload.exerciseId] = max(
      0,
      (completedSetCounts[removed.payload.exerciseId] ?? 1) - 1
    )
    persistActions()
    sendPendingActions()
    WKInterfaceDevice.current().play(.directionDown)
  }

  func selectExercise(_ index: Int) {
    guard let snapshot, snapshot.exercises.indices.contains(index) else { return }
    exerciseIndex = index
    loadExerciseDefaults()
  }

  private func loadExerciseDefaults() {
    guard let exercise = currentExercise else { return }
    reps = max(1, exercise.repMin)
    rir = exercise.targetRir ?? 2
  }

  private func activateConnectivity() {
    guard WCSession.isSupported() else { return }
    let connection = WCSession.default
    connection.delegate = self
    connection.activate()
    session = connection
    isReachable = connection.isReachable
  }

  private func receiveSnapshot(_ json: String) {
    guard let data = json.data(using: .utf8),
          let incoming = try? decoder.decode(WatchWorkoutSnapshot.self, from: data),
          incoming.version == 1,
          !incoming.sessionId.isEmpty else { return }
    if snapshot?.sessionId != incoming.sessionId {
      pendingActions = []
      completedSetCounts = [:]
      persistActions()
    }
    snapshot = incoming
    exerciseIndex = min(exerciseIndex, max(0, incoming.exercises.count - 1))
    if let encoded = try? encoder.encode(incoming) { defaults.set(encoded, forKey: storedSnapshotKey) }
    loadExerciseDefaults()
  }

  private func receiveAcknowledgements(_ ids: [String]) {
    let acknowledged = Set(ids)
    pendingActions.removeAll { acknowledged.contains($0.actionId) }
    persistActions()
    lastSyncError = nil
  }

  private func clearWorkout() {
    snapshot = nil
    exerciseIndex = 0
    completedSetCounts = [:]
    defaults.removeObject(forKey: storedSnapshotKey)
    persistActions()
  }

  private func sendPendingActions() {
    guard let session, !pendingActions.isEmpty,
          let data = try? encoder.encode(pendingActions),
          let json = String(data: data, encoding: .utf8) else { return }
    let payload: [String: Any] = [actionsKey: json]
    if session.isReachable {
      session.sendMessage(payload, replyHandler: nil) { [weak self] _ in
        session.transferUserInfo(payload)
        Task { @MainActor in self?.lastSyncError = "Saved for retry" }
      }
    } else {
      session.transferUserInfo(payload)
    }
  }

  private func restore() {
    if let data = defaults.data(forKey: storedSnapshotKey) {
      snapshot = try? decoder.decode(WatchWorkoutSnapshot.self, from: data)
    }
    if let data = defaults.data(forKey: storedActionsKey) {
      pendingActions = (try? decoder.decode([WatchWorkoutAction].self, from: data)) ?? []
    }
    if let data = defaults.data(forKey: storedSetCountsKey) {
      completedSetCounts = (try? decoder.decode([String: Int].self, from: data)) ?? [:]
    }
  }

  private func persistActions() {
    if let data = try? encoder.encode(Array(pendingActions.suffix(500))) {
      defaults.set(data, forKey: storedActionsKey)
    }
    if let data = try? encoder.encode(completedSetCounts) {
      defaults.set(data, forKey: storedSetCountsKey)
    }
  }
}

extension WatchWorkoutStore: WCSessionDelegate {
  nonisolated func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {
    Task { @MainActor in
      self.isReachable = session.isReachable
      self.lastSyncError = error == nil ? nil : "Connection unavailable"
      self.sendPendingActions()
    }
  }

  nonisolated func sessionReachabilityDidChange(_ session: WCSession) {
    Task { @MainActor in
      self.isReachable = session.isReachable
      if session.isReachable { self.sendPendingActions() }
    }
  }

  nonisolated func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    receive(message)
  }

  nonisolated func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
    receive(applicationContext)
  }

  nonisolated func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any]) {
    receive(userInfo)
  }

  nonisolated private func receive(_ payload: [String: Any]) {
    Task { @MainActor in
      if let json = payload[self.snapshotKey] as? String { self.receiveSnapshot(json) }
      if let ids = payload[self.acknowledgementsKey] as? [String] { self.receiveAcknowledgements(ids) }
      if payload[self.clearWorkoutKey] as? Bool == true { self.clearWorkout() }
    }
  }
}
