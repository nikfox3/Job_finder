export const SOURCE_NAMES: Record<string, string> = {
  remotive: "Remotive",
  remoteok: "Remote OK",
  weworkremotely: "We Work Remotely",
  himalayas: "Himalayas",
  jobicy: "Jobicy",
  workingnomads: "Working Nomads",
  arbeitnow: "Arbeitnow",
  themuse: "The Muse",
  fourdayweek: "4 Day Week",
  nodesk: "NoDesk",
  jobspresso: "Jobspresso",
  company: "Company site",
  import: "Added by link",
  linkedin: "LinkedIn",
  indeed: "Indeed",
  sample: "Sample",
};

export function sourceName(id: string) {
  return SOURCE_NAMES[id] ?? id;
}

export function formatSalary(min: number | null, max: number | null, currency: string | null) {
  if (!min && !max) return null;
  const fmt = (n: number) => `${n >= 1000 ? Math.round(n / 1000) + "k" : n}`;
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  // Contract roles are usually quoted per hour.
  const unit = (max ?? min)! < 1000 ? "/hr" : "";
  if (min && max && min !== max) return `${symbol}${fmt(min)} – ${symbol}${fmt(max)}${unit}`;
  return `${symbol}${fmt((min ?? max)!)}${unit}`;
}

export function timeAgo(iso: string | null) {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso.replace(" ", "T") + (iso.endsWith("Z") ? "" : "Z")).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// A stable color per company for the logo tile.
export function companyHue(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

/** "just now", "12 min ago", "3 h ago", "2 days ago" for timestamps stored as UTC. */
export function timeAgoPrecise(sqlDate: string | null) {
  if (!sqlDate) return null;
  const minutes = Math.floor((Date.now() - new Date(sqlDate.replace(" ", "T") + "Z").getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)} h ago`;
  const days = Math.floor(minutes / 1440);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

/** "https://www.nikfox.design/" -> "nikfox.design", for printing links. */
export function displayUrl(url: string | null | undefined) {
  return (url ?? "").replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
}
