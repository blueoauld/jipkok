const { withGradleProperties, withProjectBuildGradle } = require("expo/config-plugins");

const ANCHOR = 'apply plugin: "expo-root-project"';

const SKIP_METADATA_CHECK = `
// play-services-ads 25.x는 코틀린 2.3으로 빌드돼 이 프로젝트의 코틀린 2.1이 메타데이터를 거부한다.
// 실제 쓰는 API는 호환되므로 이 모듈에서만 버전 검사를 건너뛴다.
subprojects {
  if (name == 'react-native-google-mobile-ads') {
    tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
      compilerOptions {
        freeCompilerArgs.add('-Xskip-metadata-version-check')
      }
    }
  }
}
`;

const JVM_ARGS_KEY = "org.gradle.jvmargs";
const JVM_ARGS_VALUE = "-Xmx4096m -XX:MaxMetaspaceSize=2048m";

function withAdsKotlinMetadataFix(config) {
  return withProjectBuildGradle(config, (modConfig) => {
    if (!modConfig.modResults.contents.includes("-Xskip-metadata-version-check")) {
      modConfig.modResults.contents = modConfig.modResults.contents.replace(
        ANCHOR,
        `${SKIP_METADATA_CHECK}\n${ANCHOR}`,
      );
    }

    return modConfig;
  });
}

// 네이티브 모듈이 많아 기본 메타스페이스로는 KSP 단계에서 터진다.
function withGradleMemory(config) {
  return withGradleProperties(config, (modConfig) => {
    const existing = modConfig.modResults.find(
      (item) => item.type === "property" && item.key === JVM_ARGS_KEY,
    );

    if (existing) {
      existing.value = JVM_ARGS_VALUE;
    } else {
      modConfig.modResults.push({
        type: "property",
        key: JVM_ARGS_KEY,
        value: JVM_ARGS_VALUE,
      });
    }

    return modConfig;
  });
}

module.exports = function withAndroidAdsKotlinFix(config) {
  return withGradleMemory(withAdsKotlinMetadataFix(config));
};
