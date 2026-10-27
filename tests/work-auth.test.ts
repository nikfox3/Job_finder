import { describe, expect, it } from "vitest";
import { readWorkAuth } from "@/lib/work-auth";
import { eligibility } from "@/lib/geo";

describe("readWorkAuth", () => {
  it("finds US authorization and no sponsorship", () => {
    const w = readWorkAuth(
      "<p>You must be legally authorized to work in the United States.</p><p>We are unable to sponsor visas at this time.</p>",
    );
    expect(w.requiredIn).toEqual(["US"]);
    expect(w.sponsorship).toBe("none");
    expect(w.quotes.length).toBe(2);
  });

  it("finds residency requirements", () => {
    expect(readWorkAuth("Candidates must reside in Canada or the US.").requiredIn.sort()).toEqual(["CA", "US"]);
    expect(readWorkAuth("This role is open only to candidates based in the UK.").requiredIn).toEqual(["GB"]);
  });

  it("finds sponsorship offered, citizenship and clearance", () => {
    expect(readWorkAuth("Visa sponsorship is available for this role.").sponsorship).toBe("available");
    const w = readWorkAuth("Must be a US citizen. An active Secret clearance is required.");
    expect(w.citizenship).toBe(true);
    expect(w.clearance).toBe(true);
  });

  it("stays quiet on unrelated text", () => {
    const w = readWorkAuth("We work across time zones and love async work in Figma.");
    expect(w).toMatchObject({ requiredIn: [], sponsorship: null, citizenship: false, clearance: false });
  });
});

describe("eligibility with description", () => {
  it("treats a worldwide-looking job as US-only when the description requires US authorization", () => {
    expect(eligibility("Remote", "US", "Applicants must be authorized to work in the U.S.")).toMatchObject({ tier: 0, canApply: true });
  });

  it("marks a job as elsewhere when the description requires another country", () => {
    expect(eligibility("Remote", "US", "You must be eligible to work in Germany.")).toMatchObject({ tier: 4, canApply: false });
  });

  it("lets the stated location win when it names your country", () => {
    expect(eligibility("USA", "US", "Must be eligible to work in Germany.").tier).toBe(0);
  });
});
