import assert from "node:assert/strict";
import test from "node:test";
import { parseDateInput, readJsonBody } from "@/lib/request";

test("readJsonBody returns parsed JSON", async () => {
  const request = new Request("http://localhost/api/test", {
    method: "POST",
    body: JSON.stringify({ ok: true }),
  });

  assert.deepEqual(await readJsonBody(request), { ok: true });
});

test("readJsonBody returns null for malformed JSON", async () => {
  const request = new Request("http://localhost/api/test", {
    method: "POST",
    body: "{",
  });

  assert.equal(await readJsonBody(request), null);
});

test("parseDateInput rejects invalid dates", () => {
  assert.equal(parseDateInput("not-a-date"), null);
  assert.equal(parseDateInput("2026-07-12T10:00:00.000Z")?.toISOString(), "2026-07-12T10:00:00.000Z");
});
