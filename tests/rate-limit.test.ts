import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIp, createLimiter } from "../src/lib/rate-limit";

test("fixed window blocks past the max, reports retry-after and resets", () => {
  let now = 0;
  const check = createLimiter(() => now);
  const limits = [{ key: "ip:1", max: 3, windowMs: 10_000 }];
  for (let i = 0; i < 3; i++) assert.deepEqual(check(limits), { ok: true });
  assert.deepEqual(check(limits), { ok: false, retryAfterSeconds: 10 });
  now = 10_000;
  assert.deepEqual(check(limits), { ok: true });
});

test("a blocked key does not consume the other keys' budget", () => {
  const check = createLimiter(() => 0);
  check([{ key: "player:a", max: 1, windowMs: 1000 }]);
  assert.equal(check([{ key: "ip:x", max: 2, windowMs: 1000 }, { key: "player:a", max: 1, windowMs: 1000 }]).ok, false);
  assert.equal(check([{ key: "ip:x", max: 2, windowMs: 1000 }]).ok, true);
  assert.equal(check([{ key: "ip:x", max: 2, windowMs: 1000 }]).ok, true);
});

test("client ip prefers the first forwarded hop", () => {
  assert.equal(clientIp(new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } })), "1.2.3.4");
  assert.equal(clientIp(new Request("http://x", { headers: { "x-real-ip": "5.6.7.8" } })), "5.6.7.8");
  assert.equal(clientIp(new Request("http://x")), "unknown");
});
