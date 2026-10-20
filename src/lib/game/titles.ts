const TITLES: Record<string, readonly [string, string, string, string]> = {
  Berserker: ["Brawler", "Ravager", "Warhammer", "Legend"],
  Rogue: ["Cutpurse", "Shadow", "Ghostwriter", "Legend"],
  Arcanist: ["Spark", "Conductor", "Stormcaller", "Legend"],
  Warrior: ["Busker", "Headliner", "Monument", "Legend"],
  Bard: ["Understudy", "Soloist", "Maestro", "Legend"],
  Cleric: ["Acolyte", "Cantor", "Archivist", "Legend"],
  Enchanter: ["Hook", "Chorus", "Chart Topper", "Legend"],
  Ranger: ["Scout", "Wayfinder", "Cartographer", "Legend"],
  Monk: ["Listener", "Stillpoint", "Deep Field", "Legend"],
  Barbarian: ["Scuff", "Mosh", "Riot", "Legend"],
  Wanderer: ["Stray", "Drifter", "Unmapped", "Legend"],
};

export function masteryTitle(classId: string, level: number): string {
  const row = TITLES[classId] ?? TITLES.Wanderer;
  if (!row) return "Stray";
  if (level >= 20) return row[3];
  if (level >= 10) return row[2];
  if (level >= 5) return row[1];
  return row[0];
}
