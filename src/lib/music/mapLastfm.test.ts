import assert from "node:assert/strict";
import { test } from "node:test";
import { albumId, artistId, parseEntityId, trackId } from "./lastfmIds";
import { mapLastfmAlbums, mapLastfmRecent, mapLastfmTopArtists } from "./mapLastfm";

test("ids round-trip names that contain spaces and slashes", () => {
  const id = trackId("AC/DC", "Back In Black");
  const parsed = parseEntityId(id);
  assert.equal(parsed?.kind, "track");
  assert.deepEqual(parsed?.parts, ["ac/dc", "back in black"]);
  assert.equal(id, trackId("AC/DC", "Back In Black"));
});

test("maps top artists and albums from last.fm lists, including a single object", () => {
  const artists = mapLastfmTopArtists({
    topartists: {
      artist: {
        name: "Ada",
        image: [{ "#text": "https://example.com/ada.jpg", size: "extralarge" }],
      },
    },
  });
  assert.equal(artists[0]?.id, artistId("Ada"));
  assert.equal(artists[0]?.imageUrl, "https://example.com/ada.jpg");

  const albums = mapLastfmAlbums(
    {
      topalbums: {
        album: [
          { name: "Side A", artist: { name: "Ada" }, image: [{ "#text": "https://example.com/a.jpg", size: "large" }] },
          { name: "Side A", artist: { name: "Ada" }, image: [] },
        ],
      },
    },
    "topalbums",
  );
  assert.equal(albums.length, 1);
  assert.equal(albums[0]?.id, albumId("Ada", "Side A"));
});

test("splits the now-playing row out of recent tracks", () => {
  const mapped = mapLastfmRecent({
    recenttracks: {
      track: [
        {
          name: "Live One",
          artist: { "#text": "Ada" },
          album: { "#text": "Side A" },
          image: [{ "#text": "https://example.com/live.jpg", size: "medium" }],
          "@attr": { nowplaying: "true" },
        },
        {
          name: "Old One",
          artist: { "#text": "Bea" },
          album: { "#text": "" },
          date: { uts: "1700000000" },
        },
      ],
    },
  });
  assert.equal(mapped.nowPlaying?.trackId, trackId("Ada", "Live One"));
  assert.equal(mapped.nowPlaying?.albumId, albumId("Ada", "Side A"));
  assert.equal(mapped.history.length, 1);
  assert.equal(mapped.history[0]?.playedAt, new Date(1_700_000_000_000).toISOString());
  assert.equal(mapped.history[0]?.albumId, "");
});
