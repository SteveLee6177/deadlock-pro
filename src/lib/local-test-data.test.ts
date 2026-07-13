import assert from "node:assert/strict";
import test from "node:test";
import { parseLocalTestAllowedSteamIds } from "@/lib/local-test-data";

test("parseLocalTestAllowedSteamIds keeps only valid SteamID64 values", () => {
  const ids = parseLocalTestAllowedSteamIds(
    "76561199000000001, nope, 123, 76561199000000011 ",
  );

  assert.deepEqual([...ids], ["76561199000000001", "76561199000000011"]);
});

test("parseLocalTestAllowedSteamIds returns an empty allowlist by default", () => {
  assert.equal(parseLocalTestAllowedSteamIds(undefined).size, 0);
});
