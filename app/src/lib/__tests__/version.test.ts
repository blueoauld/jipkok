import { isOutdated } from "@/lib/version";

describe("isOutdated", () => {
  it.each([
    ["1.0.0", "1.0.1", true],
    ["1.0.0", "1.1", true],
    ["1.2.0", "1.10.0", true],
    ["1.0.0", "1.0.0", false],
    ["1.0", "1.0.0", false],
    ["2.0.0", "1.9.9", false],
  ])("%s → %s: %s", (current, latest, expected) => {
    expect(isOutdated(current, latest)).toBe(expected);
  });
});
