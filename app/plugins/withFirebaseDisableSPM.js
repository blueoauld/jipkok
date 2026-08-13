const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const FLAG = "$RNFirebaseDisableSPM = true";

const MODULAR_HEADER_PODS = [
  "GoogleUtilities",
  "FirebaseCoreInternal",
  "FirebaseCore",
  "FirebaseInstallations",
  "GoogleDataTransport",
  "nanopb",
  // 퍼포먼스가 끌고 오는 FirebaseRemoteConfig가 스위프트 파드라 이게 필요하다
  "FirebaseABTesting",
];

const TARGET_LINE = "target 'app' do";

module.exports = function withFirebaseDisableSPM(config) {
  return withDangerousMod(config, [
    "ios",
    (modConfig) => {
      const podfile = path.join(
        modConfig.modRequest.platformProjectRoot,
        "Podfile",
      );
      let contents = fs.readFileSync(podfile, "utf8");

      if (!contents.includes(FLAG)) {
        contents = `${FLAG}\n\n${contents}`;
      }

      const pods = MODULAR_HEADER_PODS.filter(
        (pod) => !contents.includes(`pod '${pod}'`),
      )
        .map((pod) => `  pod '${pod}', :modular_headers => true`)
        .join("\n");

      if (pods) {
        contents = contents.replace(TARGET_LINE, `${TARGET_LINE}\n${pods}`);
      }

      fs.writeFileSync(podfile, contents);

      return modConfig;
    },
  ]);
};
