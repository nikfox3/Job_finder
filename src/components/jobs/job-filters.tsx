"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { sourceName } from "@/lib/format";

const selectClass =
  "h-9 rounded-md border border-input bg-card px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function JobFilters({ sources }: { sources: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  function set(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("job");
    router.replace(`${pathname}?${next}`, { scroll: false });
  }

  // Debounce typing in the search box.
  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => set("q", q), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <div className="relative min-w-64 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, company or skill" className="bg-card pl-9" />
      </div>
      <select className={selectClass} value={params.get("source") ?? ""} onChange={(e) => set("source", e.target.value)}>
        <option value="">All sources</option>
        {sources.map((s) => (
          <option key={s} value={s}>
            {sourceName(s)}
          </option>
        ))}
      </select>
      <select className={selectClass} value={params.get("salary") ?? ""} onChange={(e) => set("salary", e.target.value)}>
        <option value="">Any salary</option>
        <option value="80000">$80k+</option>
        <option value="120000">$120k+</option>
        <option value="160000">$160k+</option>
      </select>
      <select className={selectClass} value={params.get("posted") ?? ""} onChange={(e) => set("posted", e.target.value)}>
        <option value="">Any time</option>
        <option value="1">Past 24 hours</option>
        <option value="7">Past week</option>
        <option value="30">Past month</option>
      </select>
      <select className={selectClass} value={params.get("sort") ?? ""} onChange={(e) => set("sort", e.target.value)}>
        <option value="">Newest first</option>
        <option value="fit">Best fit first</option>
      </select>
    </div>
  );
}
