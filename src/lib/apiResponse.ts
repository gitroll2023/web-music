/**
 * Standardized API response helpers for the SH Music App.
 *
 * These helpers provide a consistent response format across all API routes.
 * For endpoints that need backward-compatible shapes (e.g. { songs: [...] }),
 * use the raw NextResponse.json() instead and wrap with try/catch + logApiError.
 */

// ---- Response type definitions ----

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ---- Response factory functions ----

/**
 * Create a standardized success response.
 * Use this for NEW endpoints that don't have existing frontend contracts.
 */
export function successResponse<T>(data: T, status = 200): Response {
  return Response.json(
    { success: true, data } satisfies ApiSuccessResponse<T>,
    { status }
  );
}

/**
 * Create a standardized error response.
 * Use this for consistent error handling across all API routes.
 */
export function errorResponse(
  error: string,
  status = 500,
  code?: string
): Response {
  return Response.json(
    { success: false, error, code } satisfies ApiErrorResponse,
    { status }
  );
}

// ---- Logging helper ----

/**
 * Log an API error with structured context.
 * Use this in catch blocks for consistent error logging across routes.
 *
 * @param routeName - The route identifier, e.g. "GET /api/songs"
 * @param error - The caught error object
 */
export function logApiError(routeName: string, error: unknown): void {
  const timestamp = new Date().toISOString();

  if (error instanceof Error) {
    console.error(
      `[${timestamp}] API Error in ${routeName}:`,
      error.message
    );
    if (error.stack) {
      console.error(`[${timestamp}] Stack trace:`, error.stack);
    }
  } else {
    console.error(
      `[${timestamp}] API Error in ${routeName}:`,
      error
    );
  }
}

// ---- Type exports ----

export type { ApiSuccessResponse, ApiErrorResponse, ApiResponse };
