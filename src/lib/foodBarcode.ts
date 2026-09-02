export type ScannedFood = {
  barcode: string;
  calories: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  name: string;
  proteinGrams: number;
  serving: string;
};

type OpenFoodFactsProduct = {
  brands?: string;
  generic_name?: string;
  nutriments?: Record<string, unknown>;
  product_name?: string;
  serving_quantity?: number | string;
  serving_size?: string;
};

type OpenFoodFactsResponse = {
  product?: OpenFoodFactsProduct;
  status?: number;
};

function finiteNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function nutrientForServing(
  nutriments: Record<string, unknown>,
  key: string,
  servingQuantity: number | null,
) {
  const servingValue = finiteNumber(nutriments[`${key}_serving`]);

  if (servingValue !== null) {
    return servingValue;
  }

  const perHundredGrams = finiteNumber(nutriments[`${key}_100g`]);

  if (perHundredGrams === null || servingQuantity === null) {
    return 0;
  }

  return (perHundredGrams * servingQuantity) / 100;
}

export function normalizeFoodBarcode(value: string) {
  const normalized = value.replace(/\D/g, "");

  if (normalized.length < 8 || normalized.length > 14) {
    throw new RangeError("Food barcode must contain 8 to 14 digits.");
  }

  return normalized;
}

export function parseOpenFoodFactsProduct(
  barcode: string,
  response: OpenFoodFactsResponse,
): ScannedFood | null {
  if (response.status === 0 || !response.product) {
    return null;
  }

  const product = response.product;
  const name =
    product.product_name?.trim() ||
    product.generic_name?.trim() ||
    product.brands?.trim();

  if (!name) {
    return null;
  }

  const nutriments = product.nutriments ?? {};
  const servingQuantity = finiteNumber(product.serving_quantity);
  const roundGram = (value: number) => Math.round(value * 10) / 10;
  const serving =
    product.serving_size?.trim() ||
    (servingQuantity === null ? "1 serving" : `${servingQuantity} g`);

  return {
    barcode,
    calories: Math.round(
      nutrientForServing(nutriments, "energy-kcal", servingQuantity),
    ),
    carbsGrams: roundGram(
      nutrientForServing(nutriments, "carbohydrates", servingQuantity),
    ),
    fatGrams: roundGram(
      nutrientForServing(nutriments, "fat", servingQuantity),
    ),
    fiberGrams: roundGram(
      nutrientForServing(nutriments, "fiber", servingQuantity),
    ),
    name,
    proteinGrams: roundGram(
      nutrientForServing(nutriments, "proteins", servingQuantity),
    ),
    serving,
  };
}

export async function lookupFoodBarcode(
  value: string,
  fetcher: typeof fetch = fetch,
): Promise<ScannedFood | null> {
  const barcode = normalizeFoodBarcode(value);
  const response = await fetcher(
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
    {
      headers: {
        "User-Agent":
          "Fortomnia/1.0 (https://fortomnia.com)",
      },
    },
  );

  if (!response.ok) {
    throw new Error("The food database could not be reached.");
  }

  return parseOpenFoodFactsProduct(
    barcode,
    (await response.json()) as OpenFoodFactsResponse,
  );
}
