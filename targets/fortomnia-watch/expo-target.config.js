/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: "watch",
  name: "FortomniaWatch",
  displayName: "Fortomnia",
  bundleIdentifier: ".watch",
  deploymentTarget: "10.0",
  icon: "../../assets/icon.png",
  frameworks: ["SwiftUI", "WatchConnectivity", "HealthKit", "WatchKit"],
  colors: {
    $accent: "#FF6B35",
  },
  entitlements: {
    "com.apple.developer.healthkit": true,
  },
};
