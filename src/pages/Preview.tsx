import { CharacterSheet } from "@/components/CharacterSheet";
import { Header } from "@/components/Header";
import { buildCharacter } from "@/lib/game/character";
import type { ProviderArtist } from "@/lib/music/provider";

function artist(name: string, genres: string[]): ProviderArtist {
  return { id: name, name, genres, imageUrl: null, followerCount: 1000 };
}

const ARTISTS: ProviderArtist[] = [
  ...["Red Anvil", "Choir of Sparks", "Nail Choir", "Low Hymn", "Grave Radio", "Wire Mercy"].map((name) =>
    artist(name, ["thrash metal", "metal"]),
  ),
  ...["Alley Psalm", "Gold Teeth", "Second Verse"].map((name) => artist(name, ["hip hop", "rap"])),
  artist("Blue Room", ["bebop"]),
];

export function Preview() {
  const sheet = buildCharacter({
    displayName: "Marlow Voss",
    level: 1,
    xp: 0,
    artists: ARTISTS,
    albums: [
      { id: "1", name: "Hammered Gold", artistName: "Red Anvil", imageUrl: null },
      { id: "2", name: "Alley Psalm", artistName: "Alley Psalm", imageUrl: null },
      { id: "3", name: "Static Reliquary", artistName: "Choir of Sparks", imageUrl: null },
      { id: "4", name: "Neon Offertory", artistName: "Gold Teeth", imageUrl: null },
    ],
  }).model;

  return (
    <>
      <Header />
      <p className="mx-auto mb-2 max-w-5xl px-4 text-xs tracking-[0.2em] text-gold/80 md:px-8">
        FIXTURE — connect Last.fm for your own sheet
      </p>
      <CharacterSheet sheet={sheet} />
    </>
  );
}
