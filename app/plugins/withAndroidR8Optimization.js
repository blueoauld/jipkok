const {
  withAppBuildGradle,
  withGradleProperties,
} = require("expo/config-plugins");

const DEFAULT_PROGUARD_FILE =
  /getDefaultProguardFile\((['"])proguard-android\.txt\1\)/;

const OPTIMIZED_RESOURCE_SHRINKING_KEY =
  "android.r8.optimizedResourceShrinking";
const OPTIMIZED_RESOURCE_SHRINKING_VALUE = "true";

// RN 템플릿이 쓰는 proguard-android.txt에는 -dontoptimize가 들어 있어 R8이 축소와
// 난독화만 하고 최적화 패스를 건너뛴다. R8에 -dooptimize가 없어 규칙을 덧붙이는 걸로는
// 되돌릴 수 없고, AGP 9는 이 파일을 아예 거부한다.
function withOptimizedProguardFile(config) {
  return withAppBuildGradle(config, (modConfig) => {
    modConfig.modResults.contents = modConfig.modResults.contents.replace(
      DEFAULT_PROGUARD_FILE,
      "getDefaultProguardFile($1proguard-android-optimize.txt$1)",
    );

    return modConfig;
  });
}

// AGP 8.12에서는 기본값이 꺼짐이다. AGP 9부터 기본으로 켜지므로 그때 지우면 된다.
function withOptimizedResourceShrinking(config) {
  return withGradleProperties(config, (modConfig) => {
    const existing = modConfig.modResults.find(
      (item) =>
        item.type === "property" &&
        item.key === OPTIMIZED_RESOURCE_SHRINKING_KEY,
    );

    if (existing) {
      existing.value = OPTIMIZED_RESOURCE_SHRINKING_VALUE;
    } else {
      modConfig.modResults.push({
        type: "property",
        key: OPTIMIZED_RESOURCE_SHRINKING_KEY,
        value: OPTIMIZED_RESOURCE_SHRINKING_VALUE,
      });
    }

    return modConfig;
  });
}

module.exports = function withAndroidR8Optimization(config) {
  return withOptimizedResourceShrinking(withOptimizedProguardFile(config));
};
