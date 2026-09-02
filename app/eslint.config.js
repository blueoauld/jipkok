// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const simpleImportSort = require("eslint-plugin-simple-import-sort");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist"],
  },
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      // reanimated 공유값 대입(value =)을 오탐해서 끈다.
      "react-hooks/immutability": "off",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    files: ["src/tamagui.config.ts"],
    rules: {
      // 타마구이 공식 선언 병합 패턴이다.
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
]);
