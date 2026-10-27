const TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  "full-time": "Full-time",
  fulltime: "Full-time",
  part_time: "Part-time",
  "part-time": "Part-time",
  parttime: "Part-time",
  contract: "Contract",
  contractor: "Contract",
  freelance: "Freelance",
  internship: "Internship",
  intern: "Internship",
  temporary: "Temporary",
};

export function employmentLabel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, "_");
  return TYPE_LABELS[key] ?? TYPE_LABELS[key.replace(/_/g, "-")] ?? raw.trim();
}

const SENIORITY = ["Intern", "Junior", "Mid-level", "Senior", "Lead", "Staff", "Principal", "Director", "Head"];

export function seniorityFromTitle(title: string): string | null {
  const t = title.toLowerCase();
  if (/\b(intern|internship)\b/.test(t)) return "Intern";
  if (/\b(junior|jr\.?|entry)\b/.test(t)) return "Junior";
  if (/\b(principal)\b/.test(t)) return "Principal";
  if (/\b(staff)\b/.test(t)) return "Staff";
  if (/\b(director|head of|vp)\b/.test(t)) return "Director";
  if (/\b(lead)\b/.test(t)) return "Lead";
  if (/\b(senior|sr\.?)\b/.test(t)) return "Senior";
  return null;
}

export function normalizeSeniority(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const hit = SENIORITY.find((s) => raw.toLowerCase().startsWith(s.toLowerCase().slice(0, 3)));
  return hit ?? raw;
}

/** Pulls a min/max out of free text like "$90k - $120k", "€60,000–70,000/yr", "USD 100000". */
export function parseSalaryText(text: string | null | undefined): { min: number | null; max: number | null; currency: string | null } {
  const empty = { min: null, max: null, currency: null };
  if (!text) return empty;
  const currency = /€|eur/i.test(text) ? "EUR" : /£|gbp/i.test(text) ? "GBP" : /\$|usd|cad|aud/i.test(text) ? "USD" : null;
  const nums = [...text.matchAll(/(\d[\d,.]*)\s*(k)?/gi)]
    .map(([, n, k]) => {
      const value = parseFloat(n.replace(/,/g, ""));
      return k ? value * 1000 : value;
    })
    .filter((n) => n >= 10 && Number.isFinite(n));
  if (!nums.length) return empty;
  return { min: Math.min(...nums), max: Math.max(...nums), currency };
}

export function isRemoteText(text: string | null | undefined) {
  return Boolean(text && /remote|anywhere|worldwide|distributed/i.test(text));
}

export function toIso(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  // Unix seconds vs milliseconds.
  const date = typeof value === "number" ? new Date(value < 1e12 ? value * 1000 : value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function decodeEntities(s: string) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/** True when a job title looks like one of your searches, or like a design role in general. */
export function isRelevant(title: string, keywords: string[]) {
  const t = title.toLowerCase();
  if (/\bdesign(er|ers)?\b|\bux\b|\bui\b/.test(t)) return true;
  return keywords.some((k) => k && t.includes(k.toLowerCase()));
}
