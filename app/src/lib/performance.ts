import { getApp } from "@react-native-firebase/app";
import { initializePerformance } from "@react-native-firebase/perf";

const PERFORMANCE_ENABLED = !__DEV__;

export function initializePerformanceMonitoring() {
  initializePerformance(getApp(), {
    dataCollectionEnabled: PERFORMANCE_ENABLED,
    instrumentationEnabled: PERFORMANCE_ENABLED,
  });
}
