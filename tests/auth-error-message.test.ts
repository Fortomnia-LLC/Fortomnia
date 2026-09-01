import assert from "node:assert/strict";
import test from "node:test";

import { getAuthErrorMessage } from "../src/lib/authErrorMessage.ts";

test("hides serialized server failures during signup", () => {
  const message = getAuthErrorMessage(
    {
      message: '{"status":500,"headers":{"set-cookie":"private"}}',
      code: "unexpected_failure",
      status: 500,
    },
    "sign-up",
  );

  assert.equal(
    message,
    "We couldn't send your confirmation email. Please try again shortly.",
  );
  assert.equal(message.includes("headers"), false);
});

test("explains email rate limits without exposing provider details", () => {
  assert.equal(
    getAuthErrorMessage(
      { code: "over_email_send_rate_limit", status: 429 },
      "sign-up",
    ),
    "Too many emails have been requested. Please wait a few minutes and try again.",
  );
});

test("maps invalid credentials to a safe sign-in message", () => {
  assert.equal(
    getAuthErrorMessage({ code: "invalid_credentials" }, "sign-in"),
    "The email or password is incorrect.",
  );
});

test("maps invalid email addresses", () => {
  assert.equal(
    getAuthErrorMessage({ code: "email_address_invalid" }, "sign-up"),
    "Enter a valid email address.",
  );
});

test("maps network failures without exposing exception text", () => {
  assert.equal(
    getAuthErrorMessage(new Error("Network request failed"), "sign-up"),
    "We couldn't connect to Fortomnia. Check your connection and try again.",
  );
});

test("uses operation-specific fallback messages", () => {
  assert.equal(
    getAuthErrorMessage({ message: "unrecognized internal detail" }, "sign-up"),
    "We couldn't create your account. Please try again.",
  );
  assert.equal(
    getAuthErrorMessage({}, "password-reset"),
    "We couldn't send the password reset email. Please try again.",
  );
});
