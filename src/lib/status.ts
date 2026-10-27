// Shared by server and client code, so it lives outside the server-only modules.
export const STATUSES = [
  { id: "saved", label: "Saved" },
  { id: "applying", label: "Applying" },
  { id: "applied", label: "Applied" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Closed" },
] as const;

export type Status = (typeof STATUSES)[number]["id"];

export const STATUS_LABELS = Object.fromEntries(STATUSES.map((s) => [s.id, s.label])) as Record<Status, string>;
