import ExpoModulesCore
import HealthKit

public class FortomniaHealthModule: Module {
  private let healthStore = HKHealthStore()
  public func definition() -> ModuleDefinition {
    Name("FortomniaHealth")
    Function("isAvailable") { HKHealthStore.isHealthDataAvailable() }
    AsyncFunction("requestAuthorization") { (read: [String], write: [String]) async throws -> Bool in
      guard HKHealthStore.isHealthDataAvailable() else { return false }
      let readTypes = Set(read.compactMap { self.objectType(for: $0) })
      let writeTypes = Set(write.compactMap { self.sampleType(for: $0) })
      try await self.healthStore.requestAuthorization(toShare: writeTypes, read: readTypes)
      return true
    }
    AsyncFunction("readSamples") { (metrics: [String], startAt: String, endAt: String) async throws -> [[String: Any?]] in
      guard let start = ISO8601DateFormatter().date(from: startAt), let end = ISO8601DateFormatter().date(from: endAt) else { throw HealthModuleError.invalidDate }
      var output: [[String: Any?]] = []
      for metric in metrics { output.append(contentsOf: try await self.samples(for: metric, start: start, end: end)) }
      return output
    }
  }

  private func objectType(for metric: String) -> HKObjectType? {
    if metric == "sleep" { return HKObjectType.categoryType(forIdentifier: .sleepAnalysis) }
    if metric == "workout" { return HKObjectType.workoutType() }
    return sampleType(for: metric)
  }

  private func sampleType(for metric: String) -> HKSampleType? {
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

  private func samples(for metric: String, start: Date, end: Date) async throws -> [[String: Any?]] {
    guard let type = objectType(for: metric) else { return [] }
    let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: [])
    return try await withCheckedThrowingContinuation { continuation in
      let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, error in
        if let error { continuation.resume(throwing: error); return }
        continuation.resume(returning: (samples ?? []).compactMap { self.serialize($0, metric: metric) })
      }
      self.healthStore.execute(query)
    }
  }

  private func serialize(_ sample: HKSample, metric: String) -> [String: Any?]? {
    var value: Double? = nil
    var unit: String? = nil
    if let quantity = sample as? HKQuantitySample, let preferred = preferredUnit(for: metric) { value = quantity.quantity.doubleValue(for: preferred.0); unit = preferred.1 }
    else if sample is HKCategorySample, metric == "sleep" { value = sample.endDate.timeIntervalSince(sample.startDate) / 60; unit = "min" }
    else if let workout = sample as? HKWorkout, metric == "workout" { value = workout.duration / 60; unit = "min" }
    return ["id": sample.uuid.uuidString, "metric": metric, "startAt": ISO8601DateFormatter().string(from: sample.startDate), "endAt": ISO8601DateFormatter().string(from: sample.endDate), "value": value, "unit": unit, "sourceName": sample.sourceRevision.source.name, "sourceBundleId": sample.sourceRevision.source.bundleIdentifier, "externalId": sample.uuid.uuidString]
  }

  private func preferredUnit(for metric: String) -> (HKUnit, String)? {
    switch metric {
    case "steps": return (.count(), "count")
    case "active_energy": return (.kilocalorie(), "kcal")
    case "heart_rate", "resting_heart_rate": return (HKUnit.count().unitDivided(by: .minute()), "bpm")
    case "heart_rate_variability": return (.secondUnit(with: .milli), "ms")
    case "body_weight": return (.gramUnit(with: .kilo), "kg")
    case "body_fat_percentage": return (.percent(), "percent")
    default: return nil
    }
  }
}

enum HealthModuleError: Error { case invalidDate }
