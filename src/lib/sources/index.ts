import type { Source } from "./types";
import { remotive } from "./remotive";
import { remoteok } from "./remoteok";
import { weworkremotely } from "./weworkremotely";
import { himalayas } from "./himalayas";
import { jobicy } from "./jobicy";
import { workingnomads } from "./workingnomads";
import { arbeitnow } from "./arbeitnow";
import { themuse } from "./themuse";
import { fourdayweek } from "./fourdayweek";
import { jobspresso, nodesk } from "./rss-boards";

export const SOURCES: Source[] = [remotive, remoteok, weworkremotely, himalayas, jobicy, workingnomads, themuse, fourdayweek, nodesk, jobspresso, arbeitnow];

export function getSource(id: string) {
  return SOURCES.find((s) => s.id === id);
}
