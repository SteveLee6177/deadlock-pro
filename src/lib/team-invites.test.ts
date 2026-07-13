import assert from "node:assert/strict";
import test from "node:test";
import { safeReturnPath } from "@/lib/team-invites";

test("safeReturnPath accepts only same-origin paths", () => {
  assert.equal(safeReturnPath("/teams?team=abc"), "/teams?team=abc");
  assert.equal(safeReturnPath("https://example.com/teams"), null);
  assert.equal(safeReturnPath("//example.com/teams"), null);
  assert.equal(safeReturnPath(null), null);
});
