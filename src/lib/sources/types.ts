export type JobInput = {
  externalId: string;
  title: string;
  company: string;
  url: string;
  applyUrl?: string | null;
  location?: string | null;
  remote: boolean;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  description?: string | null;
  tags?: string[];
  postedAt?: string | null;
  employmentType?: string | null;
  seniority?: string | null;
  timezone?: string | null;
  companyDescription?: string | null;
  companyIndustry?: string | null;
  companySize?: string | null;
  companyWebsite?: string | null;
};

export type FetchContext = {
  keywords: string[];
  fetchJson: (url: string, init?: { method?: "GET" | "POST"; headers?: Record<string, string>; body?: string }) => Promise<unknown>;
  fetchText: (url: string) => Promise<string>;
};

export type Source = {
  id: string;
  name: string;
  description: string;
  /** Sources that return every kind of role get a title relevance filter. */
  mixedRoles: boolean;
  /** Be a good citizen: don't hit the API more often than this. */
  minIntervalMinutes: number;
  defaultEnabled: boolean;
  fetch: (ctx: FetchContext) => Promise<JobInput[]>;
};
