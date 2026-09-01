export type AuthOperation = "sign-in" | "sign-up" | "password-reset";

type AuthErrorShape = {
  code?: unknown;
  message?: unknown;
  status?: unknown;
};

function errorDetails(error: unknown) {
  if (typeof error === "string") return error.toLowerCase();

  if (error && typeof error === "object") {
    const { code, message, status } = error as AuthErrorShape;
    return [code, message, status]
      .filter((value) => value !== undefined && value !== null)
      .map(String)
      .join(" ")
      .toLowerCase();
  }

  return "";
}

export function getAuthErrorMessage(
  error: unknown,
  operation: AuthOperation,
) {
  const details = errorDetails(error);

  if (
    details.includes("over_email_send_rate_limit") ||
    details.includes("email rate limit") ||
    details.includes("too many requests") ||
    /(^|\s)429($|\s)/.test(details)
  ) {
    return "Too many emails have been requested. Please wait a few minutes and try again.";
  }

  if (
    details.includes("error sending confirmation email") ||
    details.includes("unexpected_failure") ||
    /(^|\s)500($|\s)/.test(details)
  ) {
    return operation === "sign-up"
      ? "We couldn't send your confirmation email. Please try again shortly."
      : "Fortomnia couldn't complete that request. Please try again shortly.";
  }

  if (
    details.includes("user_already_exists") ||
    details.includes("already registered") ||
    details.includes("already exists")
  ) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (
    details.includes("email_address_invalid") ||
    details.includes("invalid email")
  ) {
    return "Enter a valid email address.";
  }

  if (
    details.includes("weak_password") ||
    details.includes("password should be")
  ) {
    return "Choose a stronger password and try again.";
  }

  if (
    details.includes("invalid_credentials") ||
    details.includes("invalid login credentials")
  ) {
    return "The email or password is incorrect.";
  }

  if (
    details.includes("network request failed") ||
    details.includes("failed to fetch") ||
    details.includes("networkerror")
  ) {
    return "We couldn't connect to Fortomnia. Check your connection and try again.";
  }

  if (operation === "sign-up") {
    return "We couldn't create your account. Please try again.";
  }

  if (operation === "password-reset") {
    return "We couldn't send the password reset email. Please try again.";
  }

  return "We couldn't sign you in. Please try again.";
}
