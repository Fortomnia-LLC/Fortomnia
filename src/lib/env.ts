function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const supabaseUrl = requireEnv(
  'EXPO_PUBLIC_SUPABASE_URL',
  process.env.EXPO_PUBLIC_SUPABASE_URL,
);

export const supabasePublishableKey = requireEnv(
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
