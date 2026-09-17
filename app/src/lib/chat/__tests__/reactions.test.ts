import { groupReactions } from "@/lib/chat/reactions";

describe("groupReactions", () => {
  it("같은 이모지는 하나로 세고 내가 낀 묶음은 reacted로 표시한다", () => {
    const groups = groupReactions(
      [
        { memberId: 2, type: "HEART" },
        { memberId: 1, type: "HEART" },
        { memberId: 3, type: "LIKE" },
      ],
      1,
    );

    expect(groups).toEqual([
      { type: "HEART", emoji: "❤️", count: 2, reacted: true },
      { type: "LIKE", emoji: "👍", count: 1, reacted: false },
    ]);
  });

  it("내 반응이 다른 이모지면 상대보다 앞에 온다", () => {
    const groups = groupReactions(
      [
        { memberId: 2, type: "LIKE" },
        { memberId: 1, type: "HEART" },
      ],
      1,
    );

    expect(groups.map((group) => group.emoji)).toEqual(["❤️", "👍"]);
    expect(groups.map((group) => group.reacted)).toEqual([true, false]);
  });

  it("반응이 없으면 빈 배열이다", () => {
    expect(groupReactions([], 1)).toEqual([]);
  });
});
