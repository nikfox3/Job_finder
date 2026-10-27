import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { countryByCode } from "@/lib/geo";
import { hasWorkAuthSignals, readWorkAuth } from "@/lib/work-auth";

type Line = { tone: "good" | "bad" | "info"; text: string };

const ICONS = { good: ShieldCheck, bad: ShieldAlert, info: ShieldQuestion };
const TONES = { good: "text-success", bad: "text-danger", info: "text-muted-foreground" };

export function WorkAuthSection({ description, homeCountry }: { description: string | null; homeCountry: string }) {
  const auth = readWorkAuth(description);
  if (!hasWorkAuthSignals(auth)) return null;

  const home = countryByCode(homeCountry);
  const names = auth.requiredIn.map((c) => countryByCode(c)?.name ?? c).join(" or ");
  const lines: Line[] = [];
  if (auth.requiredIn.length) {
    const forYou = home && auth.requiredIn.includes(home.code);
    lines.push({
      tone: !home ? "info" : forYou ? "good" : "bad",
      text: `You need to be able to work in ${names}${forYou ? ", which matches where you live." : "."}`,
    });
  }
  if (auth.sponsorship === "none") lines.push({ tone: "info", text: "No visa sponsorship. Fine if you can already work there without a visa." });
  if (auth.sponsorship === "available") lines.push({ tone: "good", text: "Visa sponsorship is offered." });
  if (auth.citizenship) lines.push({ tone: "info", text: "Citizenship is required, not just work authorization." });
  if (auth.clearance) lines.push({ tone: "info", text: "Needs a government security clearance." });

  return (
    <section className="mb-6 rounded-lg border p-4">
      <h3 className="mb-3 text-sm font-semibold">Work authorization</h3>
      <ul className="grid gap-2 text-sm">
        {lines.map((l) => {
          const Icon = ICONS[l.tone];
          return (
            <li key={l.text} className="flex gap-2">
              <Icon className={`size-4 shrink-0 translate-y-0.5 ${TONES[l.tone]}`} />
              {l.text}
            </li>
          );
        })}
      </ul>
      <details className="mt-3 text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none">What the posting says</summary>
        <ul className="mt-2 grid gap-1.5">
          {auth.quotes.map((q) => (
            <li key={q} className="border-l-2 pl-2 italic">
              {q}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
