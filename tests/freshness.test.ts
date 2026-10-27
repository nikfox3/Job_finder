import { describe, expect, it } from "vitest";
import { CLOSED_PAGE, freshness } from "@/lib/freshness";

const now = Date.parse("2026-10-27T12:00:00Z");

describe("freshness", () => {
  it("flags closed postings first", () => {
    expect(freshness({ closed_at: "2026-10-26 10:00:00", posted_at: "2026-10-25 00:00:00" }, now).kind).toBe("closed");
  });
  it("flags postings over a month old", () => {
    expect(freshness({ closed_at: null, posted_at: "2026-09-20 00:00:00" }, now).kind).toBe("stale");
    expect(freshness({ closed_at: null, posted_at: "2026-10-20 00:00:00" }, now).kind).toBe("fresh");
    expect(freshness({ closed_at: null, posted_at: null }, now).kind).toBe("fresh");
  });
});

describe("CLOSED_PAGE", () => {
  it.each([
    ["This job is no longer accepting applications", true],
    ["Sorry, this position has been filled.", true],
    ["The job posting has expired", true],
    ["Applications are now closed", true],
    ["Apply now. We're no longer a small team!", false],
    ["Apply for this job", false],
  ])("%s", (text, closed) => expect(CLOSED_PAGE.test(text)).toBe(closed));
});
