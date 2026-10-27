import { parseLocation } from "./geo";

// Reads what a job description says about who can legally take the job.
// Phrase-based, so it reports what the posting says rather than guessing.

export type WorkAuth = {
  /** Countries the posting says you must be authorized to work in, or live in. */
  requiredIn: string[];
  sponsorship: "none" | "available" | null;
  citizenship: boolean;
  clearance: boolean;
  /** The sentences the signals came from, so you can check them yourself. */
  quotes: string[];
};

const AUTH = [
  /(?:legally\s+)?(?:authori[sz]ed|eligible|permitted)\s+to\s+work\s+(?:full[- ]time\s+)?(?:in|within|from)\s+(?:the\s+)?([^.;:()\n]{2,60})/gi,
  /work\s+authori[sz]ation\s+(?:in|for)\s+(?:the\s+)?([^.;:()\n]{2,60})/gi,
  /(?:must|need\s+to|required\s+to)\s+(?:be\s+)?(?:reside|residing|live|living|located|based)\s+(?:in|within)\s+(?:the\s+)?([^.;:()\n]{2,60})/gi,
  /(?:open|available)\s+(?:only\s+)?to\s+(?:candidates|applicants|residents)\s+(?:based\s+|located\s+|residing\s+)?in\s+(?:the\s+)?([^.;:()\n]{2,60})/gi,
];
const NO_SPONSOR =
  /\b(?:(?:unable|not\s+able|cannot|can\s*not|can't|will\s+not|won't|do(?:es)?\s+not|are\s+not)\s+(?:to\s+)?(?:currently\s+)?(?:offer(?:ing)?\s+|provide\s+)?sponsor|no\s+(?:visa\s+)?sponsorship|sponsorship\s+(?:is\s+)?not\s+(?:available|offered|provided)|without\s+(?:the\s+need\s+for\s+)?(?:visa\s+)?sponsorship)/i;
const SPONSOR = /\b(?:visa\s+sponsorship\s+(?:is\s+)?(?:available|offered|provided)|we\s+(?:can|will|do)\s+sponsor|(?:offer|provide)s?\s+visa\s+sponsorship)/i;
const CITIZEN = /\b(?:u\.?s\.?|united\s+states)\s+citizens?(?:hip)?\s+(?:only|is\s+required|required)|must\s+be\s+a\s+(?:u\.?s\.?|united\s+states)\s+citizen/i;
const CLEARANCE = /\b(?:security\s+clearance|secret\s+clearance|ts\/sci|clearance\s+required)\b/i;

function sentenceAround(text: string, index: number) {
  const start = Math.max(text.lastIndexOf(".", index) + 1, index - 160);
  const endDot = text.indexOf(".", index);
  const end = endDot === -1 ? Math.min(text.length, index + 200) : Math.min(endDot + 1, index + 240);
  return text.slice(start, end).trim();
}

export function htmlToText(html: string) {
  return html
    .replace(/<(br|\/p|\/li|\/h\d)[^>]*>/gi, ". ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

export function readWorkAuth(description: string | null | undefined): WorkAuth {
  const result: WorkAuth = { requiredIn: [], sponsorship: null, citizenship: false, clearance: false, quotes: [] };
  if (!description) return result;
  // "U.S." would otherwise end the sentence early.
  const text = htmlToText(description)
    .replace(/\bU\.S\.(A\.)?/g, "US")
    .replace(/\bU\.K\./g, "UK");
  const quote = (i: number) => {
    const q = sentenceAround(text, i);
    if (q && !result.quotes.includes(q) && result.quotes.length < 4) result.quotes.push(q);
  };

  for (const re of AUTH) {
    for (const m of text.matchAll(re)) {
      const countries = parseLocation(m[1]).countries;
      if (countries.length) {
        result.requiredIn.push(...countries.filter((c) => !result.requiredIn.includes(c)));
        quote(m.index!);
      }
    }
  }
  const no = text.match(NO_SPONSOR);
  const yes = text.match(SPONSOR);
  if (no) {
    result.sponsorship = "none";
    quote(no.index!);
  } else if (yes) {
    result.sponsorship = "available";
    quote(yes.index!);
  }
  const cit = text.match(CITIZEN);
  if (cit) {
    result.citizenship = true;
    quote(cit.index!);
  }
  const clr = text.match(CLEARANCE);
  if (clr) {
    result.clearance = true;
    quote(clr.index!);
  }
  return result;
}

export function hasWorkAuthSignals(w: WorkAuth) {
  return w.requiredIn.length > 0 || w.sponsorship !== null || w.citizenship || w.clearance;
}
