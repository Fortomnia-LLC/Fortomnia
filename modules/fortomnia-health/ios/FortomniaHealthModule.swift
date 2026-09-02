import ExpoModulesCore
import HealthKit

public class FortomniaHealthModule: Module {
  private let healthStore = HKHealthStore()
  private var observerQueries: [String: HKObserverQuery] = [:]
  private let backgroundMetricsKey = "fortomnia.apple-health.background-metrics.v1"

  public func definition() -> ModuleDefinition {
    Name("FortomniaHealth")
    Events("onHealthDataChanged")

    OnCreate {
      let metrics = UserDefaults.standard.stringArray(forKey: self.backgroundMetricsKey) ?? []
      self.startObserverQueries(for: metrics)
    }

    OnDestroy {
      self.stopObserverQueries()
    }

    Function("isAvailable") {
      HKHealthStore.isHealthDataAvailable()
    }

    AsyncFunction("requestAuthorization") { (read: [String], write: [String]) async throws -> [String: Any] in
      guard HKHealthStore.isHealthDataAvailable() else {
        return ["available": false, "requestCompleted": false, "grantedWrite": [], "deniedWrite": []]
      }

      let readTypes = Set<HKObjectType>(
        read.compactMap { self.sampleType(for: $0) }.map { $0 as HKObjectType }
      )
      let writeTypes = Set<HKSampleType>(write.compactMap { self.writableSampleType(for: $0) })

      try await self.healthStore.requestAuthorization(toShare: writeTypes, read: readTypes)

      let grantedWrite = write.filter { metric in
        guard let type = self.writableSampleType(for: metric) else { return false }
        return self.healthStore.authorizationStatus(for: type) == .sharingAuthorized
      }
      let deniedWrite = write.filter { metric in
        guard let type = self.writableSampleType(for: metric) else { return false }
        return self.healthStore.authorizationStatus(for: type) == .sharingDenied
      }

      // HealthKit intentionally does not reveal per-type read authorization.
      // Empty query results may mean no data exists or that access was denied.
      return [
        "available": true,
        "requestCompleted": true,
        "grantedWrite": grantedWrite,
        "deniedWrite": deniedWrite
      ]
    }

    AsyncFunction("getAuthorizationRequestStatus") { (read: [String], write: [String]) async throws -> String in
      guard HKHealthStore.isHealthDataAvailable() else { return "unavailable" }

      let readTypes = Set<HKObjectType>(
        read.compactMap { self.sampleType(for: $0) }.map { $0 as HKObjectType }
      )
      let writeTypes = Set<HKSampleType>(write.compactMap { self.writableSampleType(for: $0) })

      let status = try await withCheckedThrowingContinuation {
        (continuation: CheckedContinuation<HKAuthorizationRequestStatus, Error>) in
        self.healthStore.getRequestStatusForAuthorization(
          toShare: writeTypes,
          read: readTypes
        ) { status, error in
          if let error {
            continuation.resume(throwing: error)
          } else {
            continuation.resume(returning: status)
          }
        }
      }

      switch status {
      case .shouldRequest:
        return "should_request"
      case .unnecessary:
        return "unnecessary"
      case .unknown:
        return "unknown"
      @unknown default:
        return "unknown"
      }
    }

    AsyncFunction("readSamples") { (metrics: [String], startAt: String, endAt: String) async throws -> [[String: Any?]] in
      guard
        let start = self.date(from: startAt),
        let end = self.date(from: endAt)
      else {
        throw HealthModuleError.invalidDate
      }

      var output: [[String: Any?]] = []
      for metric in metrics {
        output.append(contentsOf: try await self.samples(for: metric, start: start, end: end))
      }
      return output
    }

    AsyncFunction("readAnchoredSamples") { (metrics: [String], startAt: String, endAt: String, anchors: [String: String]) async throws -> [String: Any] in
      guard
        let start = self.date(from: startAt),
        let end = self.date(from: endAt)
      else {
        throw HealthModuleError.invalidDate
      }

      var samples: [[String: Any?]] = []
      var deletedIds: [String] = []
      var nextAnchors: [String: String] = [:]

      for metric in metrics {
        let changes = try await self.anchoredSamples(
          for: metric,
          start: start,
          end: end,
          encodedAnchor: anchors[metric]
        )
        samples.append(contentsOf: changes.samples)
        deletedIds.append(contentsOf: changes.deletedIds)
        nextAnchors[metric] = changes.encodedAnchor
      }

      return [
        "samples": samples,
        "deletedIds": Array(Set(deletedIds)).sorted(),
        "anchors": nextAnchors
      ]
    }

    AsyncFunction("enableBackgroundDelivery") { (metrics: [String]) async throws -> [String] in
      let supported = Array(Set(metrics.filter { self.sampleType(for: $0) != nil })).sorted()
      for metric in supported {
        guard let type = self.sampleType(for: metric) else { continue }
        try await self.enableBackgroundDelivery(for: type)
      }
      UserDefaults.standard.set(supported, forKey: self.backgroundMetricsKey)
      self.startObserverQueries(for: supported)
      return supported
    }

    AsyncFunction("disableBackgroundDelivery") { () async throws -> Void in
      try await self.disableAllBackgroundDelivery()
      UserDefaults.standard.removeObject(forKey: self.backgroundMetricsKey)
      self.stopObserverQueries()
    }
  }

  private func enableBackgroundDelivery(for type: HKObjectType) async throws {
    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      healthStore.enableBackgroundDelivery(for: type, frequency: .immediate) { success, error in
        if let error { continuation.resume(throwing: error) }
        else if success { continuation.resume(returning: ()) }
        else { continuation.resume(throwing: HealthModuleError.backgroundDeliveryFailed) }
      }
    }
  }

  private func disableAllBackgroundDelivery() async throws {
    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      healthStore.disableAllBackgroundDelivery { success, error in
        if let error { continuation.resume(throwing: error) }
        else if success { continuation.resume(returning: ()) }
        else { continuation.resume(throwing: HealthModuleError.backgroundDeliveryFailed) }
      }
    }
  }

  private func startObserverQueries(for metrics: [String]) {
    stopObserverQueries()
    for metric in metrics {
      guard let type = sampleType(for: metric) else { continue }
      let query = HKObserverQuery(sampleType: type, predicate: nil) { [weak self] _, completion, error in
        defer { completion() }
        guard error == nil else { return }
        self?.sendEvent("onHealthDataChanged", ["metrics": [metric]])
      }
      observerQueries[metric] = query
      healthStore.execute(query)
    }
  }

  private func stopObserverQueries() {
    observerQueries.values.forEach { healthStore.stop($0) }
    observerQueries.removeAll()
  }

  private func date(from value: String) -> Date? {
    let fractionalFormatter = ISO8601DateFormatter()
    fractionalFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

    if let date = fractionalFormatter.date(from: value) {
      return date
    }

    return ISO8601DateFormatter().date(from: value)
  }

  private func sampleType(for metric: String) -> HKSampleType? {
    if metric == "sleep" {
      return HKObjectType.categoryType(forIdentifier: .sleepAnalysis)
    }

    if metric == "workout" {
      return HKObjectType.workoutType()
    }

    let identifier: HKQuantityTypeIdentifier?
    switch metric {
    case "steps": identifier = .stepCount
    case "active_energy": identifier = .activeEnergyBurned
    case "heart_rate": identifier = .heartRate
    case "resting_heart_rate": identifier = .restingHeartRate
    case "heart_rate_variability": identifier = .heartRateVariabilitySDNN
    case "body_weight": identifier = .bodyMass
    case "body_fat_percentage": identifier = .bodyFatPercentage
    default: identifier = nil
    }

    return identifier.flatMap { HKObjectType.quantityType(forIdentifier: $0) }
  }

  private func writableSampleType(for metric: String) -> HKSampleType? {
    switch metric {
    case "body_weight", "body_fat_percentage", "workout":
      return sampleType(for: metric)
    default:
      return nil
    }
  }

  private func samples(for metric: String, start: Date, end: Date) async throws -> [[String: Any?]] {
    guard let type = sampleType(for: metric) else { return [] }

    let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: [])
    return try await withCheckedThrowingContinuation { continuation in
      let query = HKSampleQuery(
        sampleType: type,
        predicate: predicate,
        limit: HKObjectQueryNoLimit,
        sortDescriptors: nil
      ) { _, samples, error in
        if let error {
          continuation.resume(throwing: error)
          return
        }

        continuation.resume(
          returning: (samples ?? []).compactMap { self.serialize($0, metric: metric) }
        )
      }
      self.healthStore.execute(query)
    }
  }

  private func anchoredSamples(
    for metric: String,
    start: Date,
    end: Date,
    encodedAnchor: String?
  ) async throws -> (samples: [[String: Any?]], deletedIds: [String], encodedAnchor: String) {
    guard let type = sampleType(for: metric) else {
      return ([], [], encodedAnchor ?? "")
    }

    let anchor = try decodeAnchor(encodedAnchor)
    let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: [])

    return try await withCheckedThrowingContinuation { continuation in
      let query = HKAnchoredObjectQuery(
        type: type,
        predicate: predicate,
        anchor: anchor,
        limit: HKObjectQueryNoLimit
      ) { _, added, deleted, nextAnchor, error in
        if let error {
          continuation.resume(throwing: error)
          return
        }

        do {
          let encodedNextAnchor = try self.encodeAnchor(nextAnchor)
          continuation.resume(returning: (
            (added ?? []).compactMap { self.serialize($0, metric: metric) },
            (deleted ?? []).map { $0.uuid.uuidString },
            encodedNextAnchor
          ))
        } catch {
          continuation.resume(throwing: error)
        }
      }
      self.healthStore.execute(query)
    }
  }

  private func decodeAnchor(_ encoded: String?) throws -> HKQueryAnchor? {
    guard let encoded, !encoded.isEmpty else { return nil }
    guard let data = Data(base64Encoded: encoded) else { return nil }
    do {
      return try NSKeyedUnarchiver.unarchivedObject(ofClass: HKQueryAnchor.self, from: data)
    } catch {
      // A stale or corrupt local anchor must never strand Health sync. Restart
      // this metric from an unanchored query and replace the stored anchor.
      return nil
    }
  }

  private func encodeAnchor(_ anchor: HKQueryAnchor?) throws -> String {
    guard let anchor else { throw HealthModuleError.missingAnchor }
    return try NSKeyedArchiver.archivedData(
      withRootObject: anchor,
      requiringSecureCoding: true
    ).base64EncodedString()
  }

  private func serialize(_ sample: HKSample, metric: String) -> [String: Any?]? {
    var value: Double? = nil
    var unit: String? = nil

    if let quantity = sample as? HKQuantitySample,
       let preferred = preferredUnit(for: metric) {
      value = quantity.quantity.doubleValue(for: preferred.0)
      unit = preferred.1
    } else if let category = sample as? HKCategorySample, metric == "sleep" {
      // HealthKit may return overlapping in-bed, awake, and asleep-stage
      // samples. Only asleep categories should contribute to sleep duration.
      if category.value == HKCategoryValueSleepAnalysis.inBed.rawValue ||
          category.value == HKCategoryValueSleepAnalysis.awake.rawValue {
        return nil
      }
      value = sample.endDate.timeIntervalSince(sample.startDate) / 60
      unit = "min"
    } else if let workout = sample as? HKWorkout, metric == "workout" {
      value = workout.duration / 60
      unit = "min"
    }

    let recordedTimeZone = (sample.metadata?[HKMetadataKeyTimeZone] as? String)
      .flatMap { TimeZone(identifier: $0) }
    let sampleTimeZone = recordedTimeZone ?? TimeZone.current

    return [
      "id": sample.uuid.uuidString,
      "metric": metric,
      "startAt": ISO8601DateFormatter().string(from: sample.startDate),
      "endAt": ISO8601DateFormatter().string(from: sample.endDate),
      "startTimeZoneOffsetMinutes": sampleTimeZone.secondsFromGMT(for: sample.startDate) / 60,
      "endTimeZoneOffsetMinutes": sampleTimeZone.secondsFromGMT(for: sample.endDate) / 60,
      "timeZone": sampleTimeZone.identifier,
      "value": value,
      "unit": unit,
      "sourceName": sample.sourceRevision.source.name,
      "sourceBundleId": sample.sourceRevision.source.bundleIdentifier,
      "externalId": sample.uuid.uuidString
    ]
  }

  private func preferredUnit(for metric: String) -> (HKUnit, String)? {
    switch metric {
    case "steps": return (.count(), "count")
    case "active_energy": return (.kilocalorie(), "kcal")
    case "heart_rate", "resting_heart_rate":
      return (HKUnit.count().unitDivided(by: .minute()), "bpm")
    case "heart_rate_variability": return (.secondUnit(with: .milli), "ms")
    case "body_weight": return (.gramUnit(with: .kilo), "kg")
    case "body_fat_percentage": return (.percent(), "percent")
    default: return nil
    }
  }
}

enum HealthModuleError: Error {
  case invalidDate
  case missingAnchor
  case backgroundDeliveryFailed
}

