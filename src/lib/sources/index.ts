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
import { builtin } from "./builtin";
import { wttj } from "./wttj";
import { hackernews } from "./hackernews";

export const SOURCES: Source[] = [remotive, remoteok, weworkremotely, himalayas, jobicy, workingnomads, builtin, wttj, themuse, fourdayweek, nodesk, jobspresso, hackernews, arbeitnow];

export function getSource(id: string) {
  return SOURCES.find((s) => s.id === id);
}
