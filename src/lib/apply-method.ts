export type ApplyMethod = {
  kind: "no-account" | "account" | "unknown";
  platform: string | null;
};

// Application systems, keyed by hostname suffix. "no-account" platforms let you
// apply as a guest with a simple form; "account" ones make you sign up or log in.
const PLATFORMS: [string, string, ApplyMethod["kind"]][] = [
  ["greenhouse.io", "Greenhouse", "no-account"],
  ["lever.co", "Lever", "no-account"],
  ["ashbyhq.com", "Ashby", "no-account"],
  ["workable.com", "Workable", "no-account"],
  ["bamboohr.com", "BambooHR", "no-account"],
  ["breezy.hr", "Breezy", "no-account"],
  ["recruitee.com", "Recruitee", "no-account"],
  ["teamtailor.com", "Teamtailor", "no-account"],
  ["personio.de", "Personio", "no-account"],
  ["personio.com", "Personio", "no-account"],
  ["jobvite.com", "Jobvite", "no-account"],
  ["smartrecruiters.com", "SmartRecruiters", "no-account"],
  ["myworkdayjobs.com", "Workday", "account"],
  ["myworkdaysite.com", "Workday", "account"],
  ["taleo.net", "Taleo", "account"],
  ["icims.com", "iCIMS", "account"],
  ["successfactors.com", "SuccessFactors", "account"],
  ["successfactors.eu", "SuccessFactors", "account"],
  ["oraclecloud.com", "Oracle", "account"],
  ["brassring.com", "BrassRing", "account"],
  ["ultipro.com", "UKG", "account"],
  ["linkedin.com", "LinkedIn", "account"],
  ["indeed.com", "Indeed", "account"],
  ["wellfound.com", "Wellfound", "account"],
  ["dice.com", "Dice", "account"],
];

export function applyMethod(url: string | null): ApplyMethod {
  if (!url) return { kind: "unknown", platform: null };
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return { kind: "unknown", platform: null };
  }
  const hit = PLATFORMS.find(([suffix]) => host === suffix || host.endsWith(`.${suffix}`));
  return hit ? { kind: hit[2], platform: hit[1] } : { kind: "unknown", platform: null };
}
