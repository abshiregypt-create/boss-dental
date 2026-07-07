// s3-validation-core: verify the shared validation rules and error-envelope shape.
// The .mjs loader can't import the TS helpers, but it CAN import the real `zod`
// package, so we re-declare the same field schemas and assert their behaviour,
// plus mirror parseJson's issue formatting and envelope.
import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

// Mirrors src/lib/server/validate.ts field schemas.
const zMoney = z.coerce.number().min(0, "must be >= 0").max(9_999_999_999.99, "amount too large");
const zPct = z.coerce.number().min(0, "must be >= 0").max(100, "must be <= 100");
const zNonEmpty = z.string().trim().min(1, "required");

// Mirrors formatIssues + the { error, message, details } envelope.
function toEnvelope(err) {
  const details = err.issues.map((i) => ({ path: i.path.join(".") || "(root)", message: i.message }));
  return { error: "validation_failed", message: details[0]?.message ?? "Invalid input", details };
}

test("zMoney: accepts non-negative numbers and numeric strings", () => {
  assert.equal(zMoney.parse(0), 0);
  assert.equal(zMoney.parse(1500.5), 1500.5);
  assert.equal(zMoney.parse("300"), 300); // backward-compatible coercion
});

test("zMoney: rejects negatives and NaN", () => {
  assert.equal(zMoney.safeParse(-1).success, false);
  assert.equal(zMoney.safeParse("abc").success, false);
});

test("zPct: enforces the 0..100 range", () => {
  assert.equal(zPct.parse(0), 0);
  assert.equal(zPct.parse(100), 100);
  assert.equal(zPct.safeParse(101).success, false);
  assert.equal(zPct.safeParse(-0.01).success, false);
});

test("zNonEmpty: trims and rejects blank", () => {
  assert.equal(zNonEmpty.parse("  Cleaning  "), "Cleaning");
  assert.equal(zNonEmpty.safeParse("   ").success, false);
});

test("envelope: preserves machine code, surfaces first message + details", () => {
  const schema = z.object({ price: zMoney, commissionPct: zPct });
  const res = schema.safeParse({ price: -5, commissionPct: 200 });
  assert.equal(res.success, false);
  const env = toEnvelope(res.error);
  assert.equal(env.error, "validation_failed");
  assert.ok(env.details.length >= 2);
  assert.ok(env.details.some((d) => d.path === "price"));
  assert.ok(env.details.some((d) => d.path === "commissionPct"));
  assert.equal(typeof env.message, "string");
});

test("optional money preserves null but validates a provided value", () => {
  const zCost = z.preprocess((v) => (v === "" || v == null ? null : v), zMoney.nullable());
  assert.equal(zCost.parse(null), null);
  assert.equal(zCost.parse(""), null);
  assert.equal(zCost.parse("120"), 120);
  assert.equal(zCost.safeParse(-1).success, false);
});
