// A hand-picked directory of agencies that hire designers. Plain data, so it
// works on the server and in the browser.

export type AgencyKind = "staffing" | "studio";

export type Agency = {
  name: string;
  kind: AgencyKind;
  website: string;
  /** Where they list open roles, when it's not just the website. */
  jobsUrl?: string;
  about: string;
  focus: string[];
  based?: string;
  /** How they work with remote people, when they say so publicly. */
  remote?: string;
  /** Other names their jobs get posted under. Matched case-insensitively. */
  aliases?: string[];
  /** Added by you in the app rather than part of the built-in list. */
  custom?: boolean;
};

export type CustomAgency = Pick<Agency, "name" | "kind" | "website"> & { note?: string };

export const AGENCY_KINDS: Record<AgencyKind, string> = {
  staffing: "Staffing agency",
  studio: "Design studio",
};

export const AGENCIES: Agency[] = [
  // --- Creative staffing agencies -------------------------------------------
  {
    name: "Aquent",
    kind: "staffing",
    website: "https://aquent.com",
    jobsUrl: "https://aquent.com/find-work",
    about: "Staffing for creative, marketing and UX talent. Contractors can get benefits like health insurance through them.",
    focus: ["UX", "Product design", "Visual design", "Contract"],
    based: "Boston, MA",
    aliases: ["aquent studios"],
  },
  {
    name: "Vitamin T",
    kind: "staffing",
    website: "https://vitamintalent.com",
    about: "Aquent's agency for digital creative and design talent.",
    focus: ["Digital design", "UX", "Contract"],
    based: "Boston, MA",
  },
  {
    name: "Creative Circle",
    kind: "staffing",
    website: "https://www.creativecircle.com",
    jobsUrl: "https://www.creativecircle.com/jobs/",
    about: "Creative, marketing and tech staffing with recruiters across the US.",
    focus: ["Graphic design", "UX", "Marketing design", "Contract", "Full-time"],
    based: "Los Angeles, CA",
  },
  {
    name: "24 Seven Talent",
    kind: "staffing",
    website: "https://www.24seventalent.com",
    about: "Creative, marketing, fashion and digital staffing.",
    focus: ["Creative", "Digital design", "Contract", "Full-time"],
    based: "New York, NY",
    aliases: ["24seven"],
  },
  {
    name: "Robert Half",
    kind: "staffing",
    website: "https://www.roberthalf.com",
    jobsUrl: "https://www.roberthalf.com/us/en/jobs",
    about: "A large staffing firm. Its marketing and creative practice (formerly The Creative Group) places designers in contract and full-time roles.",
    focus: ["Marketing design", "UX", "Contract", "Full-time"],
    based: "Menlo Park, CA",
    aliases: ["the creative group"],
  },
  {
    name: "Onward Search",
    kind: "staffing",
    website: "https://www.onwardsearch.com",
    about: "Staffing for digital marketing, creative and tech roles.",
    focus: ["UX", "Digital design", "Contract"],
  },
  {
    name: "Artisan Talent",
    kind: "staffing",
    website: "https://artisantalent.com",
    about: "Creative, marketing and digital staffing, formerly Artisan Creative.",
    focus: ["Creative", "UX", "Contract", "Full-time"],
    based: "Los Angeles, CA",
    aliases: ["artisan creative"],
  },
  {
    name: "Mondo",
    kind: "staffing",
    website: "https://www.mondo.com",
    about: "Tech and digital marketing staffing, including UX and product design roles.",
    focus: ["UX", "Product design", "Contract"],
  },

  // --- Design agencies and studios ------------------------------------------
  {
    name: "MetaLab",
    kind: "studio",
    website: "https://www.metalab.com",
    about: "Product design agency for startups and tech companies, known for designing Slack's early interface.",
    focus: ["Product design", "UI", "Branding"],
    based: "Victoria, BC",
    remote: "Remote-first",
  },
  {
    name: "Superside",
    kind: "studio",
    website: "https://www.superside.com",
    about: "Design subscription company that produces marketing and brand design for other companies.",
    focus: ["Marketing design", "Brand", "Motion"],
    remote: "Fully remote",
  },
  {
    name: "thoughtbot",
    kind: "studio",
    website: "https://thoughtbot.com",
    about: "Product design and development consultancy that builds web and mobile apps with clients.",
    focus: ["Product design", "UX", "Research"],
    remote: "Remote-first",
  },
  {
    name: "10up",
    kind: "studio",
    website: "https://10up.com",
    about: "Digital agency known for WordPress sites, with UX and visual design roles.",
    focus: ["Web design", "UX", "Visual design"],
    remote: "Fully distributed",
  },
  {
    name: "IDEO",
    kind: "studio",
    website: "https://www.ideo.com",
    about: "Global design and innovation firm known for human-centered design.",
    focus: ["Service design", "Research", "Product design"],
    based: "San Francisco Bay Area",
  },
  {
    name: "frog",
    kind: "studio",
    website: "https://www.frog.co",
    about: "Global design and strategy firm, part of Capgemini Invent.",
    focus: ["Product design", "Strategy", "Research"],
    aliases: ["frog design"],
  },
  {
    name: "ustwo",
    kind: "studio",
    website: "https://ustwo.com",
    about: "Digital product studio founded in London, with studios in Europe and the US.",
    focus: ["Product design", "UX", "Service design"],
    based: "London, UK",
  },
  {
    name: "Instrument",
    kind: "studio",
    website: "https://www.instrument.com",
    about: "Independent digital agency for brand and product work.",
    focus: ["Brand", "Web design", "Product design"],
    based: "Portland, OR",
  },
  {
    name: "Huge",
    kind: "studio",
    website: "https://www.hugeinc.com",
    about: "Digital experience agency working on brands, products and services.",
    focus: ["Product design", "UX", "Brand"],
    based: "Brooklyn, NY",
    aliases: ["huge inc"],
  },
  {
    name: "R/GA",
    kind: "studio",
    website: "https://www.rga.com",
    about: "Brand and product innovation agency.",
    focus: ["Brand", "Product design", "Advertising"],
    based: "New York, NY",
    aliases: ["rga"],
  },
  {
    name: "Code and Theory",
    kind: "studio",
    website: "https://www.codeandtheory.com",
    about: "Strategy, design and technology agency.",
    focus: ["Product design", "Web design", "Brand"],
    based: "New York, NY",
    aliases: ["code & theory"],
  },
  {
    name: "Fantasy",
    kind: "studio",
    website: "https://fantasy.co",
    about: "Product design agency.",
    focus: ["Product design", "UI", "Prototyping"],
    based: "New York and London",
  },
  {
    name: "DEPT",
    kind: "studio",
    website: "https://www.deptagency.com",
    about: "Global digital agency combining design, technology and marketing.",
    focus: ["Web design", "Product design", "Marketing"],
    aliases: ["dept agency"],
  },
  {
    name: "Pentagram",
    kind: "studio",
    website: "https://www.pentagram.com",
    about: "Partner-owned graphic design studio.",
    focus: ["Brand identity", "Graphic design"],
    based: "New York and London",
  },
];

/** The built-in agencies plus any you added, with yours taking priority on a name clash. */
export function allAgencies(custom: CustomAgency[] = []): Agency[] {
  const mine: Agency[] = custom.map((c) => ({
    name: c.name,
    kind: c.kind,
    website: c.website,
    about: c.note ?? "",
    focus: [],
    custom: true,
  }));
  const taken = new Set(mine.map((a) => normalize(a.name)));
  return [...mine, ...AGENCIES.filter((a) => !taken.has(normalize(a.name)))];
}

function normalize(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9/ ]/g, " ")
    .replace(/\b(inc|llc|ltd|corp)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Builds a lookup that tells you whether a job's company is one of the agencies. */
export function agencyMatcher(agencies: Agency[]) {
  const names = agencies.flatMap((a) => [a.name, ...(a.aliases ?? [])].map((n) => [normalize(n), a] as const)).filter(([n]) => n);
  return (company: string): Agency | null => {
    const c = normalize(company);
    if (!c) return null;
    // "Robert Half International" counts. One-word names must match exactly,
    // so "DEPT" doesn't tag "Dept of Education".
    for (const [n, a] of names) if (c === n || (n.includes(" ") && c.startsWith(`${n} `))) return a;
    return null;
  };
}
