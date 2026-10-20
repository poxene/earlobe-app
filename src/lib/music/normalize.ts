//— service genre tags are messy. first matching keyword wins; word boundaries keep "rock" out of "baroque".

export const GENRE_FAMILIES = [
  "Metal",
  "Hip-hop",
  "Electronic",
  "Rock",
  "Jazz",
  "Classical",
  "Pop",
  "Folk / Country",
  "Ambient / Lo-fi",
  "Punk",
  "Unmapped",
] as const;

export type GenreFamily = (typeof GENRE_FAMILIES)[number];

const RULES: { family: GenreFamily; keywords: string[] }[] = [
  { family: "Metal", keywords: ["alternative metal", "black metal", "metal", "hardcore", "grindcore", "doom", "thrash", "death"] },
  { family: "Hip-hop", keywords: ["hip hop", "hip-hop", "rap", "trap", "grime"] },
  {
    family: "Electronic",
    keywords: [
      "alternative dance",
      "indie dance",
      "hardcore techno",
      "happy hardcore",
      "drum and bass",
      "drum & bass",
      "indietronica",
      "electropop",
      "electronica",
      "future bass",
      "synthwave",
      "chillwave",
      "breakbeat",
      "uk garage",
      "electronic",
      "techno",
      "dubstep",
      "trance",
      "house",
      "disco",
      "dance",
      "edm",
      "idm",
      "dnb",
    ],
  },
  { family: "Rock", keywords: ["alternative rock", "indie rock", "punk rock", "alternative", "grunge", "rock"] },
  { family: "Jazz", keywords: ["bebop", "bossa nova", "swing", "jazz"] },
  { family: "Classical", keywords: ["classical", "orchestral", "baroque", "opera", "symphony"] },
  { family: "Pop", keywords: ["dance pop", "k-pop", "synth-pop", "pop"] },
  { family: "Folk / Country", keywords: ["singer-songwriter", "americana", "bluegrass", "country", "folk"] },
  { family: "Ambient / Lo-fi", keywords: ["lo-fi", "downtempo", "new age", "ambient", "chill"] },
  { family: "Punk", keywords: ["skate punk", "post-punk", "punk"] },
];

export function isGenreFamily(value: string): value is GenreFamily {
  return (GENRE_FAMILIES as readonly string[]).includes(value);
}

//— longer phrases win, so "alternative dance" is electronic and "dance pop" stays pop.
const KEYWORDS = RULES.flatMap((rule) => rule.keywords.map((keyword) => ({ family: rule.family, keyword }))).sort(
  (a, b) => b.keyword.length - a.keyword.length || a.keyword.localeCompare(b.keyword),
);

export function familyFromGenreTag(tag: string): GenreFamily {
  const normalized = tag.trim().toLowerCase();
  if (!normalized) return "Unmapped";
  for (const entry of KEYWORDS) {
    if (matchesKeyword(normalized, entry.keyword)) return entry.family;
  }
  return "Unmapped";
}

export function familiesForArtist(genres: string[]): GenreFamily[] {
  if (genres.length === 0) return ["Unmapped"];
  const found: GenreFamily[] = [];
  for (const genre of genres) {
    const family = familyFromGenreTag(genre);
    if (!found.includes(family)) found.push(family);
  }
  const real = found.filter((family) => family !== "Unmapped");
  return real.length > 0 ? real : ["Unmapped"];
}

function matchesKeyword(tag: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`).test(tag);
}
