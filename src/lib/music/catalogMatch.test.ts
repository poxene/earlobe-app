import assert from "node:assert/strict";
import { test } from "node:test";
import { pickAlbumArt, pickTrackDuration } from "./catalogMatch";

const MOSZKOWSKI = {
  artistName: "Markus Pawlik, Polish National Radio Symphony Orchestra & Antoni Wit",
  collectionName: "Moszkowski: Romantic Piano Concertos",
  trackName: "Piano Concerto No. 2 in E Major, Op. 59: IV. Allegro deciso",
  trackTimeMillis: 575_960,
  artworkUrl100: "https://example.com/art/100x100bb.jpg",
};

test("a long album title matches even when the catalog credits the performers", () => {
  const art = pickAlbumArt([MOSZKOWSKI], "Moritz Moszkowski", "Moszkowski: Romantic Piano Concertos");
  assert.equal(art, "https://example.com/art/600x600bb.jpg");
});

test("a short album title still has to name the artist", () => {
  const rows = [{ artistName: "Someone Else", collectionName: "Greatest Hits", artworkUrl100: "https://example.com/x/100x100bb.jpg" }];
  assert.equal(pickAlbumArt(rows, "Ada", "Greatest Hits"), null);
  assert.equal(
    pickAlbumArt(
      [{ artistName: "Ada", collectionName: "Greatest Hits", artworkUrl100: "https://example.com/ada/100x100bb.jpg" }],
      "Ada",
      "Greatest Hits",
    ),
    "https://example.com/ada/600x600bb.jpg",
  );
});

test("a translated variation title still keeps its number", () => {
  const ms = pickTrackDuration(
    [
      {
        artistName: "Gerard Schwarz & Seattle Symphony",
        trackName: "Symphonische Etuden, Op. 13: Adagio and Allegro brillante (arr. P.I. Tchaikovsky for orchestra): Finale: Allegro brillante",
        trackTimeMillis: 375_400,
      },
      {
        artistName: "Seattle Symphony & Gerard Schwarz",
        trackName: "Symphonische Etuden, Op. 13: Adagio and Allegro brillante (arr. P.I. Tchaikovsky for orchestra): Variation 11",
        trackTimeMillis: 111_093,
      },
    ],
    "Robert Schumann",
    "Etudes symphoniques (Symphonic Etudes), Op. 13, Adagio and Allegro brillante: Variation 11 [arr. P.I. Tchaikovsky for orchestra]",
    "This is Schumann",
  );
  assert.equal(ms, 111_093);
});

test("duration prefers the matching album, and ignores a different movement", () => {
  const ms = pickTrackDuration(
    [
      { ...MOSZKOWSKI, collectionName: "Some Other Album", trackTimeMillis: 120_000 },
      MOSZKOWSKI,
      { ...MOSZKOWSKI, trackName: "Piano Concerto No. 2 in E Major, Op. 59: I. Allegro", trackTimeMillis: 700_000 },
    ],
    "Moritz Moszkowski",
    "Piano Concerto No. 2 in E major, Op. 59: IV. Allegro deciso",
    "Moszkowski: Romantic Piano Concertos",
  );
  assert.equal(ms, 575_960);
});
