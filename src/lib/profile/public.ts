import type { CharacterSheetModel, GenreBar, ListenerRecord, RelicView, Stats } from "@/lib/game/character";
import type { BodyType } from "@/lib/portrait/body";

export type PublicProfile = {
  displayName: string;
  className: string;
  subclass: string | null;
  classColor: string;
  level: number;
  stats: Stats;
  dps: number;
  genres: GenreBar[];
  relics: (RelicView | null)[];
  skills: string[];
  victories: number;
  escapes: number;
  record: ListenerRecord;
  badges: string[];
  body: BodyType;
};

export function toPublicProfile(sheet: CharacterSheetModel): PublicProfile {
  return {
    displayName: sheet.displayName,
    className: sheet.className,
    subclass: sheet.subclass,
    classColor: sheet.classColor,
    level: sheet.level,
    stats: sheet.stats,
    dps: sheet.dps,
    genres: sheet.genres,
    relics: sheet.relics,
    skills: sheet.skills,
    victories: sheet.victories,
    escapes: sheet.escapes,
    record: sheet.record,
    badges: sheet.badges,
    body: sheet.body,
  };
}
