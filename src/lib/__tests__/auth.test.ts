// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ set: mockSet }),
}));

beforeEach(() => {
  mockSet.mockClear();
});

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

async function getCreateSession() {
  const { createSession } = await import("@/lib/auth");
  return createSession;
}

test("sets the auth-token cookie", async () => {
  const createSession = await getCreateSession();
  await createSession("user-1", "test@example.com");

  expect(mockSet).toHaveBeenCalledOnce();
  expect(mockSet.mock.calls[0][0]).toBe("auth-token");
});

test("cookie is httpOnly with lax sameSite and root path", async () => {
  const createSession = await getCreateSession();
  await createSession("user-1", "test@example.com");

  const options = mockSet.mock.calls[0][2];
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("cookie expires in approximately 7 days", async () => {
  const createSession = await getCreateSession();
  const before = Date.now();
  await createSession("user-1", "test@example.com");
  const after = Date.now();

  const expires: Date = mockSet.mock.calls[0][2].expires;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("token is a valid JWT containing userId and email", async () => {
  const createSession = await getCreateSession();
  await createSession("user-42", "alice@example.com");

  const token: string = mockSet.mock.calls[0][1];
  const { payload } = await jwtVerify(token, JWT_SECRET);

  expect(payload.userId).toBe("user-42");
  expect(payload.email).toBe("alice@example.com");
});

test("cookie is not secure outside production", async () => {
  const original = process.env.NODE_ENV;
  // jsdom sets NODE_ENV to "test", which is not "production"
  const createSession = await getCreateSession();
  await createSession("user-1", "test@example.com");

  const options = mockSet.mock.calls[0][2];
  expect(options.secure).toBe(false);
  // @ts-ignore restoring read-only env for test hygiene
  process.env.NODE_ENV = original;
});
