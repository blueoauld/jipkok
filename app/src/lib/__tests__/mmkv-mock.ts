// 테스트에서는 네이티브 MMKV를 붙일 수 없어 메모리로 대신한다.
export function createMMKV() {
  const map = new Map<string, string>();

  return {
    getString: (key: string) => map.get(key),
    set: (key: string, value: string) => {
      map.set(key, value);
    },
    remove: (key: string) => {
      map.delete(key);
    },
  };
}
