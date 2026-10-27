import { describe, expect, it } from "vitest";
import { eligibility, parseLocation } from "@/lib/geo";

describe("parseLocation", () => {
  it.each([
    ["USA", ["US"], [], false],
    ["Remote - US", ["US"], [], false],
    ["Anywhere in the United States", ["US"], [], false],
    ["United States, Canada", ["US", "CA"], [], false],
    ["Austin, Texas", ["US"], [], false],
    ["Toronto, ON", ["CA"], [], false],
    ["UK or Europe", ["GB"], ["europe"], false],
    ["EMEA", [], ["europe", "middle-east", "africa"], false],
    ["LATAM", [], ["latin-america"], false],
    ["Americas", [], ["north-america", "latin-america"], false],
    ["Anywhere in the World", [], [], true],
    ["Worldwide", [], [], true],
    ["Remote", [], [], false],
    ["", [], [], false],
  ])("%s", (text, countries, regions, worldwide) => {
    const r = parseLocation(text);
    expect(r.countries.sort()).toEqual([...countries].sort());
    expect(r.regions.sort()).toEqual([...regions].sort());
    expect(r.worldwide).toBe(worldwide);
  });

  it("doesn't read the word 'us' in a sentence as the United States", () => {
    expect(parseLocation("join us from anywhere").countries).toEqual([]);
  });

  it("doesn't read South America as the United States", () => {
    expect(parseLocation("South America").countries).toEqual([]);
  });
});

describe("eligibility", () => {
  it("ranks your country, then region, then worldwide, then elsewhere", () => {
    expect(eligibility("USA", "US")).toMatchObject({ tier: 0, canApply: true, label: "Open to United States" });
    expect(eligibility("North America", "US")).toMatchObject({ tier: 1, canApply: true });
    expect(eligibility("Worldwide", "US")).toMatchObject({ tier: 2, canApply: true });
    expect(eligibility(null, "US")).toMatchObject({ tier: 3, canApply: true });
    expect(eligibility("Germany", "US")).toMatchObject({ tier: 4, canApply: false, label: "Only Germany" });
  });

  it("orders other countries by distance", () => {
    const mexico = eligibility("Mexico", "US").distanceKm;
    const japan = eligibility("Japan", "US").distanceKm;
    expect(mexico).toBeLessThan(japan);
  });

  it("does nothing without a home country", () => {
    expect(eligibility("Germany", "")).toMatchObject({ canApply: true });
  });
});
