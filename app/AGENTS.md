# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# @emnapi/core, @emnapi/runtime을 지우지 말 것

코드에서 직접 import하지 않지만 devDependencies에 일부러 선언해둔 것이다.

`eslint-config-expo`가 `unrs-resolver`를 거쳐 optional 패키지 `@unrs/resolver-binding-wasm32-wasi`를 끌고 오고, 그 하위 의존성이 이 둘이다. macOS에서 `npm install`을 하면 npm이 이 항목들을 package-lock.json에서 쳐내는데, EAS는 리눅스에서 `npm ci`를 돌리기 때문에 lock에 없으면 빌드가 의존성 설치 단계에서 즉시 실패한다.

직접 의존성으로 선언해두면 npm이 lock에서 쳐내지 않는다.
