const JWT_FUTURE_PATTERN = /jwt issued at future/i;
const JWT_FUTURE_RETRY_DELAY_MS = 1500;

type Wait = (milliseconds: number) => Promise<void>;

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function getRequestMethod(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
) {
  const inputMethod =
    typeof input === "object" &&
    input !== null &&
    "method" in input
      ? String(input.method)
      : undefined;

  return (init?.method ?? inputMethod ?? "GET").toUpperCase();
}

export function createJwtClockSkewRetryFetch(
  fetchImplementation: typeof fetch,
  delay: Wait = wait,
): typeof fetch {
  const fetchWithRetry = async (
    ...args: Parameters<typeof fetch>
  ): Promise<Response> => {
    const response = await fetchImplementation(...args);
    const method = getRequestMethod(args[0], args[1]);

    if (
      response.status !== 401 ||
      (method !== "GET" && method !== "HEAD")
    ) {
      return response;
    }

    let responseBody = "";

    try {
      responseBody = await response.clone().text();
    } catch {
      return response;
    }

    if (!JWT_FUTURE_PATTERN.test(responseBody)) {
      return response;
    }

    await delay(JWT_FUTURE_RETRY_DELAY_MS);

    return fetchImplementation(...args);
  };

  return fetchWithRetry as typeof fetch;
}
