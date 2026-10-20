import assert from "node:assert/strict";
import { test } from "node:test";
import { mapNowPlaying } from "./mapNowPlaying";

test("maps a playing track and treats an empty player as silence", () => {
  assert.equal(mapNowPlaying(null), null);
  assert.equal(mapNowPlaying({ is_playing: false }), null);

  const now = mapNowPlaying({
    is_playing: true,
    progress_ms: 12000,
    item: {
      id: "track-1",
      name: "Side A",
      duration_ms: 180000,
      artists: [{ name: "Red Anvil" }, { name: "Choir" }],
      album: {
        id: "alb",
        name: "Hammered Gold",
        images: [{ url: "https://example.com/cover.jpg", width: 64 }],
      },
    },
  });

  assert.equal(now?.trackName, "Side A");
  assert.deepEqual(now?.artistNames, ["Red Anvil", "Choir"]);
  assert.equal(now?.albumImageUrl, "https://example.com/cover.jpg");
  assert.equal(now?.isPlaying, true);
  assert.equal(now?.progressMs, 12000);
});
