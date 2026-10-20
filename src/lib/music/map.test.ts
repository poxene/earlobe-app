import assert from "node:assert/strict";
import { test } from "node:test";
import { mapTopArtists } from "./mapArtists";
import { mapAlbumCovers } from "./mapTracks";

test("maps top artists and keeps follower counts", () => {
  const artists = mapTopArtists({
    items: [
      {
        id: "a",
        name: "Ada",
        genres: ["baroque"],
        images: [{ url: "https://example.com/wide.jpg", width: 640 }],
        followers: { total: 12 },
      },
    ],
  });
  assert.equal(artists[0]?.name, "Ada");
  assert.equal(artists[0]?.imageUrl, "https://example.com/wide.jpg");
  assert.equal(artists[0]?.followerCount, 12);
  assert.deepEqual(artists[0]?.genres, ["baroque"]);
});

test("dedupes album covers from top tracks", () => {
  const covers = mapAlbumCovers({
    items: [
      {
        album: { id: "alb", name: "Side A", images: [{ url: "https://example.com/a.jpg", width: 300 }], artists: [{ name: "Ada" }] },
      },
      {
        album: { id: "alb", name: "Side A", images: [{ url: "https://example.com/a.jpg", width: 300 }] },
      },
      {
        album: { id: "alb2", name: "Side B", images: [], artists: [] },
        artists: [{ name: "Bea" }],
      },
    ],
  });
  assert.equal(covers.length, 2);
  assert.equal(covers[0]?.artistName, "Ada");
  assert.equal(covers[1]?.artistName, "Bea");
  assert.equal(covers[1]?.imageUrl, null);
});
