export type ScannedSupplement = {
  barcode: string;
  doseAmount: number | null;
  doseUnit: string | null;
  ingredients: string;
  name: string;
  serving: string;
  source: "Open Food Facts";
  sourceUrl: string;
};

type OpenFoodFactsProduct = {
  brands?: string;
  generic_name?: string;
  ingredients_text?: string;
  product_name?: string;
  quantity?: string;
  serving_size?: string;
};

type OpenFoodFactsResponse = {
  product?: OpenFoodFactsProduct;
  status?: number;
};

export function normalizeSupplementBarcode(value: string): string {
  const normalized = value.replace(/\D/g, "");
  if (normalized.length < 8 || normalized.length > 14) {
    throw new RangeError("Supplement barcode must contain 8 to 14 digits.");
  }
  return normalized;
}

function parseServingDose(serving: string): {
  amount: number | null;
  unit: string | null;
} {
  const match = serving.match(
    /(?:^|\s)(\d+(?:\.\d+)?)\s*(mcg|µg|mg|g|ml|iu|capsules?|tablets?|softgels?|scoops?|servings?)(?:\s|$|\))/i,
  );
  if (!match) return { amount: null, unit: null };
  return {
    amount: Number(match[1]),
    unit: match[2].toLowerCase().replace(/s$/, ""),
  };
}

export function parseOpenFoodFactsSupplement(
  barcode: string,
  response: OpenFoodFactsResponse,
): ScannedSupplement | null {
  if (response.status === 0 || !response.product) return null;
  const product = response.product;
  const productName =
    product.product_name?.trim() || product.generic_name?.trim();
  const brand = product.brands?.trim();
  const name = [brand, productName]
    .filter((value, index, values): value is string =>
      Boolean(value) && values.indexOf(value) === index,
    )
    .join(" ");
  if (!name) return null;

  const serving =
    product.serving_size?.trim() || product.quantity?.trim() || "";
  const dose = parseServingDose(serving);
  return {
    barcode,
    doseAmount: dose.amount,
    doseUnit: dose.unit,
    ingredients: product.ingredients_text?.trim().slice(0, 4000) || "",
    name,
    serving: serving.slice(0, 200),
    source: "Open Food Facts",
    sourceUrl: `https://world.openfoodfacts.org/product/${barcode}`,
  };
}

export async function lookupSupplementBarcode(
  value: string,
  fetcher: typeof fetch = fetch,
): Promise<ScannedSupplement | null> {
  const barcode = normalizeSupplementBarcode(value);
  const response = await fetcher(
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
    { headers: { "User-Agent": "Fortomnia/1.0 (https://fortomnia.com)" } },
  );
  if (!response.ok) {
    throw new Error("The product database could not be reached.");
  }
  return parseOpenFoodFactsSupplement(
    barcode,
    (await response.json()) as OpenFoodFactsResponse,
  );
}
