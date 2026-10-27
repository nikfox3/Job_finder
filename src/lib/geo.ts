import { readWorkAuth } from "./work-auth";

// Works out where a job can be done from, using only the job's location text.
// Country-level on purpose: job feeds rarely say more than "US only" or "EMEA".

export type Region = "north-america" | "latin-america" | "europe" | "middle-east" | "africa" | "asia" | "oceania";

type Country = { code: string; name: string; region: Region; lat: number; lng: number; aliases: string[]; codes?: string[] };

// Approximate centroids, used only to order "nearest first".
export const COUNTRIES: Country[] = [
  { code: "US", name: "United States", region: "north-america", lat: 39.8, lng: -98.6, aliases: ["united states", "usa", "u.s.", "u.s.a."], codes: ["US", "USA"] },
  { code: "CA", name: "Canada", region: "north-america", lat: 56.1, lng: -106.3, aliases: ["canada"] },
  { code: "MX", name: "Mexico", region: "latin-america", lat: 23.6, lng: -102.5, aliases: ["mexico", "méxico"] },
  { code: "BR", name: "Brazil", region: "latin-america", lat: -14.2, lng: -51.9, aliases: ["brazil", "brasil"] },
  { code: "AR", name: "Argentina", region: "latin-america", lat: -38.4, lng: -63.6, aliases: ["argentina"] },
  { code: "CL", name: "Chile", region: "latin-america", lat: -35.7, lng: -71.5, aliases: ["chile"] },
  { code: "CO", name: "Colombia", region: "latin-america", lat: 4.6, lng: -74.3, aliases: ["colombia"] },
  { code: "PE", name: "Peru", region: "latin-america", lat: -9.2, lng: -75.0, aliases: ["peru"] },
  { code: "UY", name: "Uruguay", region: "latin-america", lat: -32.5, lng: -55.8, aliases: ["uruguay"] },
  { code: "CR", name: "Costa Rica", region: "latin-america", lat: 9.7, lng: -83.8, aliases: ["costa rica"] },
  { code: "GB", name: "United Kingdom", region: "europe", lat: 54.0, lng: -2.5, aliases: ["united kingdom", "great britain", "britain", "england", "scotland", "wales", "london"], codes: ["UK", "GB"] },
  { code: "IE", name: "Ireland", region: "europe", lat: 53.4, lng: -8.2, aliases: ["ireland", "dublin"] },
  { code: "FR", name: "France", region: "europe", lat: 46.2, lng: 2.2, aliases: ["france", "paris"] },
  { code: "DE", name: "Germany", region: "europe", lat: 51.2, lng: 10.5, aliases: ["germany", "deutschland", "berlin", "munich", "hamburg"] },
  { code: "NL", name: "Netherlands", region: "europe", lat: 52.1, lng: 5.3, aliases: ["netherlands", "holland", "amsterdam"] },
  { code: "BE", name: "Belgium", region: "europe", lat: 50.5, lng: 4.5, aliases: ["belgium"] },
  { code: "LU", name: "Luxembourg", region: "europe", lat: 49.8, lng: 6.1, aliases: ["luxembourg"] },
  { code: "CH", name: "Switzerland", region: "europe", lat: 46.8, lng: 8.2, aliases: ["switzerland", "zurich", "zürich"] },
  { code: "AT", name: "Austria", region: "europe", lat: 47.5, lng: 14.6, aliases: ["austria", "vienna"] },
  { code: "ES", name: "Spain", region: "europe", lat: 40.5, lng: -3.7, aliases: ["spain", "españa", "madrid", "barcelona"] },
  { code: "PT", name: "Portugal", region: "europe", lat: 39.4, lng: -8.2, aliases: ["portugal", "lisbon"] },
  { code: "IT", name: "Italy", region: "europe", lat: 41.9, lng: 12.6, aliases: ["italy", "italia", "milan"] },
  { code: "SE", name: "Sweden", region: "europe", lat: 60.1, lng: 18.6, aliases: ["sweden", "stockholm"] },
  { code: "NO", name: "Norway", region: "europe", lat: 60.5, lng: 8.5, aliases: ["norway", "oslo"] },
  { code: "DK", name: "Denmark", region: "europe", lat: 56.3, lng: 9.5, aliases: ["denmark", "copenhagen"] },
  { code: "FI", name: "Finland", region: "europe", lat: 61.9, lng: 25.7, aliases: ["finland", "helsinki"] },
  { code: "PL", name: "Poland", region: "europe", lat: 51.9, lng: 19.1, aliases: ["poland", "warsaw"] },
  { code: "CZ", name: "Czechia", region: "europe", lat: 49.8, lng: 15.5, aliases: ["czechia", "czech republic", "prague"] },
  { code: "HU", name: "Hungary", region: "europe", lat: 47.2, lng: 19.5, aliases: ["hungary", "budapest"] },
  { code: "RO", name: "Romania", region: "europe", lat: 45.9, lng: 25.0, aliases: ["romania"] },
  { code: "BG", name: "Bulgaria", region: "europe", lat: 42.7, lng: 25.5, aliases: ["bulgaria"] },
  { code: "GR", name: "Greece", region: "europe", lat: 39.1, lng: 21.8, aliases: ["greece"] },
  { code: "HR", name: "Croatia", region: "europe", lat: 45.1, lng: 15.2, aliases: ["croatia"] },
  { code: "RS", name: "Serbia", region: "europe", lat: 44.0, lng: 21.0, aliases: ["serbia"] },
  { code: "EE", name: "Estonia", region: "europe", lat: 58.6, lng: 25.0, aliases: ["estonia"] },
  { code: "LV", name: "Latvia", region: "europe", lat: 56.9, lng: 24.6, aliases: ["latvia"] },
  { code: "LT", name: "Lithuania", region: "europe", lat: 55.2, lng: 23.9, aliases: ["lithuania"] },
  { code: "UA", name: "Ukraine", region: "europe", lat: 48.4, lng: 31.2, aliases: ["ukraine"] },
  { code: "TR", name: "Turkey", region: "europe", lat: 39.0, lng: 35.2, aliases: ["turkey", "türkiye", "istanbul"] },
  { code: "IL", name: "Israel", region: "middle-east", lat: 31.0, lng: 34.9, aliases: ["israel", "tel aviv"] },
  { code: "AE", name: "United Arab Emirates", region: "middle-east", lat: 23.4, lng: 53.8, aliases: ["united arab emirates", "dubai", "abu dhabi"], codes: ["UAE"] },
  { code: "SA", name: "Saudi Arabia", region: "middle-east", lat: 23.9, lng: 45.1, aliases: ["saudi arabia", "riyadh"] },
  { code: "EG", name: "Egypt", region: "africa", lat: 26.8, lng: 30.8, aliases: ["egypt", "cairo"] },
  { code: "ZA", name: "South Africa", region: "africa", lat: -30.6, lng: 22.9, aliases: ["south africa", "cape town", "johannesburg"] },
  { code: "NG", name: "Nigeria", region: "africa", lat: 9.1, lng: 8.7, aliases: ["nigeria", "lagos"] },
  { code: "KE", name: "Kenya", region: "africa", lat: 0.0, lng: 37.9, aliases: ["kenya", "nairobi"] },
  { code: "GH", name: "Ghana", region: "africa", lat: 7.9, lng: -1.0, aliases: ["ghana"] },
  { code: "MA", name: "Morocco", region: "africa", lat: 31.8, lng: -7.1, aliases: ["morocco"] },
  { code: "IN", name: "India", region: "asia", lat: 20.6, lng: 79.0, aliases: ["india", "bangalore", "bengaluru", "mumbai", "delhi", "hyderabad", "pune"] },
  { code: "PK", name: "Pakistan", region: "asia", lat: 30.4, lng: 69.3, aliases: ["pakistan"] },
  { code: "BD", name: "Bangladesh", region: "asia", lat: 23.7, lng: 90.4, aliases: ["bangladesh"] },
  { code: "SG", name: "Singapore", region: "asia", lat: 1.35, lng: 103.8, aliases: ["singapore"] },
  { code: "MY", name: "Malaysia", region: "asia", lat: 4.2, lng: 102.0, aliases: ["malaysia", "kuala lumpur"] },
  { code: "ID", name: "Indonesia", region: "asia", lat: -0.8, lng: 113.9, aliases: ["indonesia", "jakarta"] },
  { code: "PH", name: "Philippines", region: "asia", lat: 12.9, lng: 121.8, aliases: ["philippines", "manila"] },
  { code: "TH", name: "Thailand", region: "asia", lat: 15.9, lng: 101.0, aliases: ["thailand", "bangkok"] },
  { code: "VN", name: "Vietnam", region: "asia", lat: 14.1, lng: 108.3, aliases: ["vietnam", "viet nam"] },
  { code: "JP", name: "Japan", region: "asia", lat: 36.2, lng: 138.3, aliases: ["japan", "tokyo"] },
  { code: "KR", name: "South Korea", region: "asia", lat: 35.9, lng: 127.8, aliases: ["south korea", "korea", "seoul"] },
  { code: "CN", name: "China", region: "asia", lat: 35.9, lng: 104.2, aliases: ["china", "shanghai", "beijing"] },
  { code: "HK", name: "Hong Kong", region: "asia", lat: 22.3, lng: 114.2, aliases: ["hong kong"] },
  { code: "TW", name: "Taiwan", region: "asia", lat: 23.7, lng: 121.0, aliases: ["taiwan", "taipei"] },
  { code: "AU", name: "Australia", region: "oceania", lat: -25.3, lng: 133.8, aliases: ["australia", "sydney", "melbourne"] },
  { code: "NZ", name: "New Zealand", region: "oceania", lat: -40.9, lng: 174.9, aliases: ["new zealand", "auckland"] },
];

// Places that mean "this country" without naming it.
const US_PLACES = [
  "alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut", "delaware", "florida", "georgia", "hawaii",
  "idaho", "illinois", "indiana", "iowa", "kansas", "kentucky", "louisiana", "maine", "maryland", "massachusetts", "michigan",
  "minnesota", "mississippi", "missouri", "montana", "nebraska", "nevada", "new hampshire", "new jersey", "new mexico", "new york",
  "north carolina", "north dakota", "ohio", "oklahoma", "oregon", "pennsylvania", "rhode island", "south carolina", "south dakota",
  "tennessee", "texas", "utah", "vermont", "virginia", "washington", "west virginia", "wisconsin", "wyoming", "san francisco",
  "los angeles", "seattle", "boston", "chicago", "austin", "denver", "nyc",
];
const CA_PLACES = ["ontario", "quebec", "british columbia", "alberta", "manitoba", "nova scotia", "toronto", "vancouver", "montreal"];

export const REGION_NAMES: Record<Region, string> = {
  "north-america": "North America",
  "latin-america": "Latin America",
  europe: "Europe",
  "middle-east": "the Middle East",
  africa: "Africa",
  asia: "Asia",
  oceania: "Australia & NZ",
};

const REGION_CENTERS: Record<Region, [number, number]> = {
  "north-america": [45, -100],
  "latin-america": [-10, -60],
  europe: [50, 10],
  "middle-east": [27, 45],
  africa: [5, 20],
  asia: [25, 100],
  oceania: [-28, 145],
};

const REGION_ALIASES: [string, Region[]][] = [
  ["north america", ["north-america"]],
  ["americas", ["north-america", "latin-america"]],
  ["latin america", ["latin-america"]],
  ["latam", ["latin-america"]],
  ["south america", ["latin-america"]],
  ["central america", ["latin-america"]],
  ["europe", ["europe"]],
  ["european union", ["europe"]],
  ["emea", ["europe", "middle-east", "africa"]],
  ["mena", ["middle-east", "africa"]],
  ["middle east", ["middle-east"]],
  ["africa", ["africa"]],
  ["apac", ["asia", "oceania"]],
  ["asia pacific", ["asia", "oceania"]],
  ["asia-pacific", ["asia", "oceania"]],
  ["asia", ["asia"]],
  ["oceania", ["oceania"]],
  ["anz", ["oceania"]],
];
const REGION_CODES: [string, Region[]][] = [
  ["EU", ["europe"]],
  ["EEA", ["europe"]],
  ["NA", ["north-america"]],
];

const WORLDWIDE = /\b(worldwide|anywhere|global(ly)?|all countries|any location|international)\b/i;

function wordRe(alias: string, flags: string) {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}])${escaped}(?=$|[^\\p{L}])`, flags);
}

const COUNTRY_MATCHERS = COUNTRIES.map((c) => ({
  code: c.code,
  res: [
    ...c.aliases.map((a) => wordRe(a, "iu")),
    // Upper-case codes only, so "us" in a sentence doesn't count.
    ...(c.codes ?? []).map((a) => wordRe(a, "u")),
    ...(c.code === "US" ? US_PLACES.map((p) => wordRe(p, "iu")) : []),
    ...(c.code === "CA" ? CA_PLACES.map((p) => wordRe(p, "iu")) : []),
  ],
}));
const REGION_MATCHERS = [
  ...REGION_ALIASES.map(([a, r]) => ({ re: wordRe(a, "iu"), regions: r })),
  ...REGION_CODES.map(([a, r]) => ({ re: wordRe(a, "u"), regions: r })),
];

export type Reach = { countries: string[]; regions: Region[]; worldwide: boolean };

export function parseLocation(text: string | null | undefined): Reach {
  if (!text?.trim()) return { countries: [], regions: [], worldwide: false };
  const countries = COUNTRY_MATCHERS.filter((m) => m.res.some((re) => re.test(text))).map((m) => m.code);
  const regions = [...new Set(REGION_MATCHERS.filter((m) => m.re.test(text)).flatMap((m) => m.regions))];
  // "Anywhere in the US" is a US job, not a worldwide one.
  const worldwide = WORLDWIDE.test(text) && countries.length === 0 && regions.length === 0;
  return { countries, regions, worldwide };
}

export function countryByCode(code: string | null | undefined) {
  return COUNTRIES.find((c) => c.code === code) ?? null;
}

function distanceKm([lat1, lng1]: [number, number], [lat2, lng2]: [number, number]) {
  const rad = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lng2 - lng1) * rad) / 2) ** 2;
  return 12_742 * Math.asin(Math.sqrt(a));
}

/**
 * How reachable a job is from your country, best first:
 *   0 your country is named · 1 your region is named · 2 worldwide · 3 not stated · 4 somewhere else
 */
export type Eligibility = { tier: 0 | 1 | 2 | 3 | 4; label: string; canApply: boolean; distanceKm: number };

export function eligibility(location: string | null, home: string, description?: string | null): Eligibility {
  const me = countryByCode(home);
  const reach = parseLocation(location);
  if (!me) return { tier: 3, label: location ?? "Location not stated", canApply: true, distanceKm: 0 };

  if (reach.countries.includes(me.code)) return { tier: 0, label: `Open to ${me.name}`, canApply: true, distanceKm: 0 };

  // Many "Remote" or "Worldwide" listings say who they really hire in the description.
  const required = readWorkAuth(description).requiredIn;
  if (required.length) {
    if (required.includes(me.code)) return { tier: 0, label: `${me.name}-based only`, canApply: true, distanceKm: 0 };
    reach.countries = required;
    reach.regions = [];
    reach.worldwide = false;
  }

  if (reach.regions.includes(me.region)) return { tier: 1, label: `Open to ${REGION_NAMES[me.region]}`, canApply: true, distanceKm: 0 };
  if (reach.worldwide) return { tier: 2, label: "Worldwide", canApply: true, distanceKm: 0 };
  if (!reach.countries.length && !reach.regions.length) return { tier: 3, label: "Location not stated", canApply: true, distanceKm: 0 };

  const from: [number, number] = [me.lat, me.lng];
  const points = [
    ...reach.countries.map((code) => countryByCode(code)!).map((c): [number, number] => [c.lat, c.lng]),
    ...reach.regions.map((r) => REGION_CENTERS[r]),
  ];
  const nearest = Math.min(...points.map((p) => distanceKm(from, p)));
  const first = reach.countries.length ? countryByCode(reach.countries[0])!.name : REGION_NAMES[reach.regions[0]];
  const more = reach.countries.length + reach.regions.length > 1 ? " +more" : "";
  return { tier: 4, label: `Only ${first}${more}`, canApply: false, distanceKm: Math.round(nearest) };
}
