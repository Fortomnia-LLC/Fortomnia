const { withEntitlementsPlist, withGradleProperties, withInfoPlist } = require("expo/config-plugins");
module.exports = function withFortomniaHealth(config) {
  config = withGradleProperties(config, (config) => {
    const key = "android.minSdkVersion";
    const existing = config.modResults.find((entry) => entry.type === "property" && entry.key === key);
    if (existing) {
      existing.value = "26";
    } else {
      config.modResults.push({ type: "property", key, value: "26" });
    }
    return config;
  });
  config = withEntitlementsPlist(config, (config) => {
    config.modResults["com.apple.developer.healthkit"] = true;
    config.modResults["com.apple.developer.healthkit.background-delivery"] = true;
    return config;
  });
  config = withInfoPlist(config, (config) => {
    config.modResults.NSHealthShareUsageDescription = "Fortomnia reads health and activity data you choose to share to personalize training, recovery, and progress insights.";
    config.modResults.NSHealthUpdateUsageDescription = "Fortomnia can save workouts and body measurements to Apple Health when you choose to enable it.";
    return config;
  });
  return config;
};
