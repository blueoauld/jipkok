// 테스트에는 네이티브 Firebase가 없어 모듈을 불러오는 것만으로 터진다. 보고 자체는
// 검증 대상이 아니므로 빈 구현으로 대신하고, reportError의 로직은 그대로 돌게 둔다.
jest.mock("@react-native-firebase/crashlytics", () => ({
  getCrashlytics: () => ({}),
  recordError: jest.fn(),
  setCrashlyticsCollectionEnabled: () => Promise.resolve(null),
}));
