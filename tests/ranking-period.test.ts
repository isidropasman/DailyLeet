import { test } from "node:test";
import { deepStrictEqual } from "node:assert";
import { weekRange } from "../src/lib/ranking-period";

test("weekly ranking uses Monday through Sunday in UTC across year boundaries", () => {
  deepStrictEqual(weekRange("2027-01-01"), { start: "2026-12-28", end: "2027-01-03" });
  deepStrictEqual(weekRange("2027-01-04"), { start: "2027-01-04", end: "2027-01-10" });
});
