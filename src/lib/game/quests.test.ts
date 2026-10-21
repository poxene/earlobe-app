import assert from "node:assert/strict";
import { test } from "node:test";
import { trackId } from "../music/lastfmIds";
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
  const partial = questProgress(
    { type: "ritual", albumId: "alb", albumName: "Record", trackIds: tracks },
    [play("t1", "1"), play("t2", "2")],
    [],
  );
  assert.equal(partial.current, 2);
  assert.equal(partial.completed, false);
});

test("a ritual accepts the scrobbled title when the album list drops the subtitle", () => {
  const first = trackId("Taking Back Sunday", "Set Phasers to Stun");
  const listed = trackId("Taking Back Sunday", "This Photograph Is Proof");
  const scrobbled = trackId("Taking Back Sunday", "This Photograph Is Proof (I Know You Know)");
  const progress = questProgress(
    { type: "ritual", albumId: "alb", albumName: "Where You Want to Be", trackIds: [first, listed] },
    [
      { trackId: first, albumId: "alb", artistIds: ["a"], playedAt: "1" },
      { trackId: scrobbled, albumId: "alb", artistIds: ["a"], playedAt: "2" },
    ],
    [],
  );
  assert.equal(progress.current, 2);
  assert.equal(progress.completed, true);
});

test("a deep cut counts distinct tracks by that artist", () => {
  const play = (trackId: string, at: string): ListenFact => ({
    trackId,
    albumId: "alb",
    artistIds: ["hidden"],
    playedAt: at,
  });
  const deep = questProgress(
    { type: "deep_cut", artistId: "hidden", artistName: "Hidden", target: 5 },
    [play("t1", "1"), play("t1", "2"), play("t2", "3")],
    [],
  );
  assert.equal(deep.current, 2);
});
