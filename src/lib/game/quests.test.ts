import assert from "node:assert/strict";
import { test } from "node:test";
import { questProgress, ritualComplete, type ListenFact } from "./quests";

const album = (id: string, family: string, played: number, total: number) => ({
  albumId: id,
  family,
  tracksPlayed: played,
  tracksTotal: total,
});

test("discovery counts finished albums outside the top families", () => {
  const progress = questProgress(
    { type: "discovery", families: ["Jazz"], target: 3, seedAlbumId: null, seedLabel: "Jazz" },
    [],
    [album("a", "Jazz", 8, 8), album("b", "Jazz", 3, 10), album("c", "Metal", 10, 10)],
  );
  assert.equal(progress.current, 1);
  assert.equal(progress.completed, false);
});

test("a ritual completes only when the album plays in order", () => {
  const tracks = ["t1", "t2", "t3"];
  const play = (trackId: string, at: string, albumId = "alb"): ListenFact => ({
    trackId,
    albumId,
    artistIds: ["a"],
    playedAt: at,
  });
  assert.equal(
    ritualComplete(tracks, [play("t1", "1"), play("other", "2"), play("t2", "3"), play("t3", "4")]),
    false,
  );
  assert.equal(ritualComplete(tracks, [play("t1", "1"), play("t2", "2"), play("t3", "3")]), true);
  const deep = questProgress(
    { type: "deep_cut", artistId: "hidden", artistName: "Hidden", target: 5 },
    [play("t1", "1"), play("t1", "2"), play("t2", "3")].map((row) => ({ ...row, artistIds: ["hidden"] })),
    [],
  );
  assert.equal(deep.current, 2);
});
