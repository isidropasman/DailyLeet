import { test } from "node:test";
import assert from "node:assert/strict";
import { shareMessage } from "../src/lib/share";

test("share message contains the score, challenge day and site link", () => {
  const message = shareMessage({ score: 97, day: "2026-11-12", title: "Sin repetir", url: "https://game.example", practice: false });
  assert.match(message, /97\/100/);
  assert.match(message, /12\/11\/2026/);
  assert.match(message, /Sin repetir/);
  assert.match(message, /https:\/\/game\.example/);
  assert.doesNotMatch(message, /Práctica/);
});

test("practice share is explicitly labeled", () => {
  assert.match(shareMessage({ score: 80, day: "2026-11-12", title: "Sin repetir", url: "https://game.example", practice: true }), /Práctica/);
});

test("share message shows passed and failed cases without revealing the solution", () => {
  const message = shareMessage({ score: 75, day: "2026-11-16", title: "Esperando el calor", url: "https://game.example", practice: false, cases: [true, false, true] });
  assert.match(message, /🟩🟥🟩 2\/3 casos/);
});
