package expo.modules.fortomniahealth

import android.content.Context
import android.content.Intent
import androidx.activity.result.contract.ActivityResultContract
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.BodyFatRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.Serializable
import java.time.Instant
import kotlin.reflect.KClass

class FortomniaHealthModule : Module() {
  private lateinit var permissionLauncher: AppContextActivityResultLauncher<ArrayList<String>, Set<String>>

  override fun definition() = ModuleDefinition {
    Name("FortomniaHealth")

    RegisterActivityContracts {
      permissionLauncher = registerForActivityResult(HealthPermissionsContract())
    }

    Function("isAvailable") {
      HealthConnectClient.getSdkStatus(requireContext()) == HealthConnectClient.SDK_AVAILABLE
    }

    AsyncFunction("getAuthorizationRequestStatus") Coroutine { read: List<String>, write: List<String> ->
      if (!isAvailable()) return@Coroutine "unavailable"
      val requested = permissions(read, write)
      val granted = client().permissionController.getGrantedPermissions()
      if (granted.containsAll(requested)) "unnecessary" else "should_request"
    }

    AsyncFunction("requestAuthorization") Coroutine { read: List<String>, write: List<String> ->
      if (!isAvailable()) {
        return@Coroutine mapOf("available" to false, "requestCompleted" to false, "grantedWrite" to emptyList<String>(), "deniedWrite" to emptyList<String>())
      }
      val requested = permissions(read, write)
      permissionLauncher.launch(ArrayList(requested))
      val granted = client().permissionController.getGrantedPermissions()
      val grantedWrite = write.filter { metric -> writePermission(metric)?.let(granted::contains) == true }
      val deniedWrite = write.filterNot(grantedWrite::contains)
      mapOf("available" to true, "requestCompleted" to true, "grantedWrite" to grantedWrite, "deniedWrite" to deniedWrite)
    }

    AsyncFunction("readSamples") Coroutine { metrics: List<String>, startAt: String, endAt: String ->
      val start = Instant.parse(startAt)
      val end = Instant.parse(endAt)
      metrics.flatMap { readMetric(it, start, end) }
    }
  }

  private fun requireContext() = appContext.reactContext ?: throw IllegalStateException("Android context is unavailable")
  private fun isAvailable() = HealthConnectClient.getSdkStatus(requireContext()) == HealthConnectClient.SDK_AVAILABLE
  private fun client() = HealthConnectClient.getOrCreate(requireContext())

  private fun recordClass(metric: String): KClass<out androidx.health.connect.client.records.Record>? = when (metric) {
    "steps" -> StepsRecord::class
    "active_energy" -> ActiveCaloriesBurnedRecord::class
    "heart_rate" -> HeartRateRecord::class
    "resting_heart_rate" -> RestingHeartRateRecord::class
    "heart_rate_variability" -> HeartRateVariabilityRmssdRecord::class
    "sleep" -> SleepSessionRecord::class
    "body_weight" -> WeightRecord::class
    "body_fat_percentage" -> BodyFatRecord::class
    "workout" -> ExerciseSessionRecord::class
    else -> null
  }

  private fun readPermission(metric: String) = recordClass(metric)?.let(HealthPermission::getReadPermission)
  private fun writePermission(metric: String) = recordClass(metric)?.let(HealthPermission::getWritePermission)
  private fun permissions(read: List<String>, write: List<String>) =
    (read.mapNotNull(::readPermission) + write.mapNotNull(::writePermission)).toSet()

  private suspend fun readMetric(metric: String, start: Instant, end: Instant): List<Map<String, Any?>> = when (metric) {
    "steps" -> read<StepsRecord>(start, end).map { interval(it.metadata.id, metric, it.startTime, it.endTime, it.startZoneOffset?.totalSeconds, it.endZoneOffset?.totalSeconds, it.count.toDouble(), "count", it.metadata.dataOrigin.packageName) }
    "active_energy" -> read<ActiveCaloriesBurnedRecord>(start, end).map { interval(it.metadata.id, metric, it.startTime, it.endTime, it.startZoneOffset?.totalSeconds, it.endZoneOffset?.totalSeconds, it.energy.inKilocalories, "kcal", it.metadata.dataOrigin.packageName) }
    "heart_rate" -> read<HeartRateRecord>(start, end).flatMap { record -> record.samples.map { sample -> point("${record.metadata.id}:${sample.time.toEpochMilli()}", metric, sample.time, record.startZoneOffset?.totalSeconds, sample.beatsPerMinute.toDouble(), "bpm", record.metadata.dataOrigin.packageName) } }
    "resting_heart_rate" -> read<RestingHeartRateRecord>(start, end).map { point(it.metadata.id, metric, it.time, it.zoneOffset?.totalSeconds, it.beatsPerMinute.toDouble(), "bpm", it.metadata.dataOrigin.packageName) }
    "heart_rate_variability" -> read<HeartRateVariabilityRmssdRecord>(start, end).map { point(it.metadata.id, metric, it.time, it.zoneOffset?.totalSeconds, it.heartRateVariabilityMillis, "ms", it.metadata.dataOrigin.packageName) }
    "sleep" -> read<SleepSessionRecord>(start, end).map { interval(it.metadata.id, metric, it.startTime, it.endTime, it.startZoneOffset?.totalSeconds, it.endZoneOffset?.totalSeconds, java.time.Duration.between(it.startTime, it.endTime).toMinutes().toDouble(), "min", it.metadata.dataOrigin.packageName) }
    "body_weight" -> read<WeightRecord>(start, end).map { point(it.metadata.id, metric, it.time, it.zoneOffset?.totalSeconds, it.weight.inKilograms, "kg", it.metadata.dataOrigin.packageName) }
    "body_fat_percentage" -> read<BodyFatRecord>(start, end).map { point(it.metadata.id, metric, it.time, it.zoneOffset?.totalSeconds, it.percentage.value, "percent", it.metadata.dataOrigin.packageName) }
    "workout" -> read<ExerciseSessionRecord>(start, end).map { interval(it.metadata.id, metric, it.startTime, it.endTime, it.startZoneOffset?.totalSeconds, it.endZoneOffset?.totalSeconds, java.time.Duration.between(it.startTime, it.endTime).toMinutes().toDouble(), "min", it.metadata.dataOrigin.packageName) }
    else -> emptyList()
  }

  private suspend inline fun <reified T : androidx.health.connect.client.records.Record> read(start: Instant, end: Instant): List<T> =
    client().readRecords(ReadRecordsRequest(T::class, TimeRangeFilter.between(start, end))).records

  private fun point(id: String, metric: String, time: Instant, zoneSeconds: Int?, value: Double, unit: String, source: String) =
    interval(id, metric, time, time, zoneSeconds, zoneSeconds, value, unit, source)

  private fun interval(id: String, metric: String, start: Instant, end: Instant, startZoneSeconds: Int?, endZoneSeconds: Int?, value: Double, unit: String, source: String) = mapOf(
    "id" to id, "externalId" to id, "metric" to metric, "startAt" to start.toString(), "endAt" to end.toString(),
    "startTimeZoneOffsetMinutes" to startZoneSeconds?.div(60), "endTimeZoneOffsetMinutes" to endZoneSeconds?.div(60),
    "value" to value, "unit" to unit, "sourceBundleId" to source
  )
}

private class HealthPermissionsContract : AppContextActivityResultContract<ArrayList<String>, Set<String>> {
  private val delegate: ActivityResultContract<Set<String>, Set<String>> = PermissionController.createRequestPermissionResultContract()
  override fun createIntent(context: Context, input: ArrayList<String>): Intent = delegate.createIntent(context, input.toSet())
  override fun parseResult(input: ArrayList<String>, resultCode: Int, intent: Intent?): Set<String> = delegate.parseResult(resultCode, intent)
}
