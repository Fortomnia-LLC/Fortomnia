import ExpoModulesCore
import WatchConnectivity

public final class FortomniaWatchModule: Module, WCSessionDelegate {
  private let snapshotKey = "fortomnia.workout.snapshot.v1"
  private let actionsKey = "fortomnia.workout.actions.v1"
  private let acknowledgementsKey = "fortomnia.workout.acknowledgements.v1"

  private var session: WCSession? {
    WCSession.isSupported() ? WCSession.default : nil
  }

  public func definition() -> ModuleDefinition {
    Name("FortomniaWatch")
    Events("onWatchActions", "onWatchStateChanged")

    OnCreate {
      self.activateSession()
    }

    Function("getState") {
      self.statePayload()
    }

    AsyncFunction("activate") { () async -> [String: Any] in
      self.activateSession()
      return self.statePayload()
    }

    AsyncFunction("sendWorkoutSnapshot") { (snapshotJson: String) async throws -> [String: Any] in
      guard let session = self.session else { throw WatchModuleError.unsupported }
      guard self.isJSONObject(snapshotJson) else { throw WatchModuleError.invalidPayload }
      self.activateSession()

      do {
        try session.updateApplicationContext([self.snapshotKey: snapshotJson])
      } catch {
        throw WatchModuleError.transferFailed
      }

      if session.activationState == .activated && session.isReachable {
        session.sendMessage([self.snapshotKey: snapshotJson], replyHandler: nil) { _ in }
      }
      return self.statePayload()
    }

    AsyncFunction("acknowledgeActions") { (actionIds: [String]) async throws -> Void in
      guard let session = self.session else { throw WatchModuleError.unsupported }
      let ids = Array(Set(actionIds.filter { !$0.isEmpty })).sorted()
      guard !ids.isEmpty else { return }
      self.activateSession()

      let payload: [String: Any] = [self.acknowledgementsKey: ids]
      if session.activationState == .activated && session.isReachable {
        session.sendMessage(payload, replyHandler: nil) { _ in
          session.transferUserInfo(payload)
        }
      } else {
        session.transferUserInfo(payload)
      }
    }
  }

  private func activateSession() {
    guard let session else { return }
    session.delegate = self
    if session.activationState != .activated {
      session.activate()
    }
  }

  private func statePayload() -> [String: Any] {
    guard let session else {
      return ["supported": false, "activated": false, "paired": false, "appInstalled": false, "reachable": false]
    }
    return [
      "supported": true,
      "activated": session.activationState == .activated,
      "paired": session.isPaired,
      "appInstalled": session.isWatchAppInstalled,
      "reachable": session.isReachable
    ]
  }

  private func isJSONObject(_ value: String) -> Bool {
    guard let data = value.data(using: .utf8),
          let object = try? JSONSerialization.jsonObject(with: data) else { return false }
    return object is [String: Any]
  }

  private func receive(_ payload: [String: Any]) {
    guard let actionsJson = payload[actionsKey] as? String,
          isJSONArray(actionsJson) else { return }
    sendEvent("onWatchActions", ["actionsJson": actionsJson])
  }

  private func isJSONArray(_ value: String) -> Bool {
    guard let data = value.data(using: .utf8),
          let object = try? JSONSerialization.jsonObject(with: data) else { return false }
    return object is [Any]
  }

  public func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {
    sendEvent("onWatchStateChanged", statePayload())
  }

  public func sessionDidBecomeInactive(_ session: WCSession) {
    sendEvent("onWatchStateChanged", statePayload())
  }

  public func sessionDidDeactivate(_ session: WCSession) {
    session.activate()
    sendEvent("onWatchStateChanged", statePayload())
  }

  public func sessionReachabilityDidChange(_ session: WCSession) {
    sendEvent("onWatchStateChanged", statePayload())
  }

  public func sessionWatchStateDidChange(_ session: WCSession) {
    sendEvent("onWatchStateChanged", statePayload())
  }

  public func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    receive(message)
  }

  public func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any]) {
    receive(userInfo)
  }
}

private enum WatchModuleError: Error {
  case unsupported
  case invalidPayload
  case transferFailed
}
