import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  lookupSupplementBarcode,
  normalizeSupplementBarcode,
  parseOpenFoodFactsSupplement,
} from "../src/lib/supplementBarcode.ts";

const screen = readFileSync("src/screens/NewSupplementScreen.tsx", "utf8");
const migration = readFileSync(
  "supabase/migrations/20260915152808_add_supplement_product_metadata.sql",
  "utf8",
);

test("normalizes supported supplement barcodes", () => {
  assert.equal(normalizeSupplementBarcode("0 12345-67890 5"), "012345678905");
  assert.throws(() => normalizeSupplementBarcode("123"), RangeError);
});

test("maps product identity, serving, ingredients, and provenance", () => {
  assert.deepEqual(
    parseOpenFoodFactsSupplement("012345678905", {
      status: 1,
      product: {
        brands: "Fortomnia Labs",
        ingredients_text: "Creatine monohydrate",
        product_name: "Creatine",
        serving_size: "5 g",
      },
    }),
    {
      barcode: "012345678905",
      doseAmount: 5,
      doseUnit: "g",
      ingredients: "Creatine monohydrate",
      name: "Fortomnia Labs Creatine",
      serving: "5 g",
      source: "Open Food Facts",
      sourceUrl: "https://world.openfoodfacts.org/product/012345678905",
    },
  );
});

test("keeps incomplete product facts editable instead of inventing them", () => {
  const product = parseOpenFoodFactsSupplement("012345678905", {
    status: 1,
    product: { product_name: "Unknown-dose supplement" },
  });
  assert.equal(product?.doseAmount, null);
  assert.equal(product?.doseUnit, null);
  assert.equal(product?.ingredients, "");
  assert.equal(parseOpenFoodFactsSupplement("012345678905", { status: 0 }), null);
});

test("lookup checks HTTP status and parses a matching product", async () => {
  const product = await lookupSupplementBarcode(
    "012345678905",
    async () =>
      new Response(JSON.stringify({
        status: 1,
        product: { product_name: "Vitamin D", serving_size: "1 softgel" },
      })),
  );
  assert.equal(product?.name, "Vitamin D");
  assert.equal(product?.doseUnit, "softgel");
});

test("supplement form supports permission-aware scanning and manual fallback", () => {
  assert.match(screen, /useCameraPermissions/);
  assert.match(screen, /CameraView/);
  assert.match(screen, /lookupSupplementBarcode/);
  assert.match(screen, /You can still enter the supplement manually/);
  assert.match(screen, /Review every field before saving/);
  assert.match(screen, /Community product data can be incomplete/);
});

test("database metadata is ownership-scoped and duplicate-safe", () => {
  assert.match(migration, /alter table public\.supplement_protocols/);
  assert.match(migration, /barcode ~ '\^\[0-9\]\{8,14\}\$'/);
  assert.match(migration, /unique index supplement_protocols_user_barcode_idx/);
  assert.match(migration, /\(user_id, barcode\)/);
  assert.match(screen, /already uses this barcode/);
});
