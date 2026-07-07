import { NextResponse } from "next/server";

/**
 * Consistent JSON error envelope for API routes.
 *
 * The shape is `{ error: "<code>" }` — matching every existing route — optionally
 * enriched with a human `message` (the dashboard shows `j.message || j.error`)
 * and structured `details`. Keeping `error` as a stable machine code means the
 * frontend's existing error handling keeps working (backward compatible).
 */
export type ErrorExtra = { message?: string; details?: unknown; requestId?: string };

export function errorJson(code: string, status: number, extra?: ErrorExtra): NextResponse {
  return NextResponse.json({ error: code, ...extra }, { status });
}

/** 400 for an unparseable request body. */
export function badJson(): NextResponse {
  return errorJson("bad_json", 400);
}

/** Random id to correlate a client-visible error with the server log line. */
export function newRequestId(): string {
  return globalThis.crypto.randomUUID();
}

/**
 * Log an unexpected error server-side and return a generic 500 that never leaks
 * a stack trace or internal message to the client. The `requestId` ties the
 * client response to the server log for support.
 */
export function serverError(context: string, err: unknown): NextResponse {
  const requestId = newRequestId();
  console.error(`[api-error] ${context} rid=${requestId}`, err);
  return errorJson("internal_error", 500, { requestId });
}

/**
 * Wrap an async route handler so any thrown error becomes a safe 500 instead of
 * Next's default (which can surface internals in dev). Opt-in per route.
 */
export function withErrorHandling<A extends unknown[]>(
  context: string,
  handler: (...args: A) => Promise<NextResponse>,
): (...args: A) => Promise<NextResponse> {
  return async (...args: A): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      return serverError(context, err);
    }
  };
}
