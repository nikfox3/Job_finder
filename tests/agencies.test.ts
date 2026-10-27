import { describe, expect, it } from "vitest";
import { AGENCIES, agencyMatcher, allAgencies } from "@/lib/agencies";

describe("agencyMatcher", () => {
  const match = agencyMatcher(allAgencies());

  it("finds agencies by name, alias and legal suffix", () => {
    expect(match("Aquent")?.name).toBe("Aquent");
    expect(match("Aquent Studios")?.name).toBe("Aquent");
    expect(match("Robert Half International Inc.")?.name).toBe("Robert Half");
    expect(match("The Creative Group")?.name).toBe("Robert Half");
    expect(match("Code & Theory")?.name).toBe("Code and Theory");
    expect(match("R/GA")?.kind).toBe("studio");
    expect(match("Creative Circle, LLC")?.kind).toBe("staffing");
  });

  it("doesn't tag companies that only share a word", () => {
    expect(match("Dept of Veterans Affairs")).toBeNull();
    expect(match("Huge Dataset Labs")).toBeNull();
    expect(match("Figma")).toBeNull();
    expect(match("")).toBeNull();
  });

  it("includes agencies you add, and yours win on a name clash", () => {
    const mine = allAgencies([{ name: "Small Studio", kind: "studio", website: "https://small.studio" }, { name: "Aquent", kind: "studio", website: "" }]);
    const m = agencyMatcher(mine);
    expect(m("Small Studio")?.custom).toBe(true);
    expect(m("Aquent")?.kind).toBe("studio");
    expect(mine.filter((a) => a.name === "Aquent")).toHaveLength(1);
  });

  it("has both kinds and unique names", () => {
    expect(AGENCIES.some((a) => a.kind === "staffing")).toBe(true);
    expect(AGENCIES.some((a) => a.kind === "studio")).toBe(true);
    expect(new Set(AGENCIES.map((a) => a.name)).size).toBe(AGENCIES.length);
  });
});
