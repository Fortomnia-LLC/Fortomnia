const { withEntitlementsPlist, withInfoPlist } = require("expo/config-plugins");
module.exports = function withFortomniaHealth(config) {
  config = withEntitlementsPlist(config, (config) => { config.modResults["com.apple.developer.healthkit"] = true; return config; });
  config = withInfoPlist(config, (config) => {
    config.modResults.NSHealthShareUsageDescription = "Fortomnia reads health and activity data you choose to share to personalize training, recovery, and progress insights.";
    config.modResults.NSHealthUpdateUsageDescription = "Fortomnia can save workouts and body measurements to Apple Health when you choose to enable it.";
    return config;
  });
  return config;
};
