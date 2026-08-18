import { MY_PROFILE_KEY } from "@/hooks/useMyProfile";
import { ApiError } from "@/lib/api";
import { createQueryClient } from "@/lib/query";

const SUSPENDED = new ApiError(403, "SUSPENSION_003", "정지");

function testClient() {
  const client = createQueryClient();

  const defaults = client.getDefaultOptions();

  client.setDefaultOptions({
    queries: { ...defaults.queries, gcTime: 0 },
    mutations: { ...defaults.mutations, gcTime: 0 },
  });

  return client;
}
const OTHER = new ApiError(404, "CHAT_004", "없음");

describe("createQueryClient", () => {
  it("어떤 조회든 SUSPENSION_003을 받으면 내 프로필을 다시 읽는다", async () => {
    const client = testClient();
    const profileFetch = jest.fn().mockResolvedValue({ memberId: 1 });

    await client.prefetchQuery({
      queryKey: MY_PROFILE_KEY,
      queryFn: profileFetch,
    });
    await client
      .fetchQuery({
        queryKey: ["chats"],
        queryFn: () => Promise.reject(SUSPENDED),
      })
      .catch(() => undefined);
    await client.refetchQueries({ queryKey: MY_PROFILE_KEY, type: "active" });

    expect(client.getQueryState(MY_PROFILE_KEY)?.isInvalidated).toBe(true);
    client.clear();
  });

  it("뮤테이션 실패도 같은 코드면 프로필을 무효화한다", async () => {
    const client = testClient();
    const profileFetch = jest.fn().mockResolvedValue({ memberId: 1 });

    await client.prefetchQuery({
      queryKey: MY_PROFILE_KEY,
      queryFn: profileFetch,
    });
    await client
      .getMutationCache()
      .build(client, { mutationFn: () => Promise.reject(SUSPENDED) })
      .execute(undefined)
      .catch(() => undefined);

    expect(client.getQueryState(MY_PROFILE_KEY)?.isInvalidated).toBe(true);
    client.clear();
  });

  it("다른 오류는 프로필을 건드리지 않는다", async () => {
    const client = testClient();

    await client.prefetchQuery({
      queryKey: MY_PROFILE_KEY,
      queryFn: () => Promise.resolve({}),
    });
    await client
      .fetchQuery({ queryKey: ["chats"], queryFn: () => Promise.reject(OTHER) })
      .catch(() => undefined);

    expect(client.getQueryState(MY_PROFILE_KEY)?.isInvalidated).toBe(false);
    client.clear();
  });

  it("4xx는 재시도하지 않고 5xx는 재시도한다", async () => {
    const client = testClient();
    const clientError = jest
      .fn()
      .mockRejectedValue(new ApiError(400, "COMMON_001", "x"));
    const serverError = jest
      .fn()
      .mockRejectedValue(new ApiError(500, "COMMON_999", "x"));

    await client
      .fetchQuery({ queryKey: ["a"], queryFn: clientError, retryDelay: 0 })
      .catch(() => undefined);
    await client
      .fetchQuery({ queryKey: ["b"], queryFn: serverError, retryDelay: 0 })
      .catch(() => undefined);

    expect(clientError).toHaveBeenCalledTimes(1);
    expect(serverError).toHaveBeenCalledTimes(3);
    client.clear();
  });
});
