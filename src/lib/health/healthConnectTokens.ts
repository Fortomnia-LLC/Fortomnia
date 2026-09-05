export function parseHealthConnectTokens(value: string): Record<string, string> {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] =>
        typeof entry[1] === "string" && entry[1].length > 0 && entry[1].length <= 4096,
      ),
    );
  } catch {
    return {};
  }
}
