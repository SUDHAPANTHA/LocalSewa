export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong"
): string {
  if (typeof error === "object" && error !== null) {
    const maybeResponse = (error as {
      response?: { data?: { msg?: string; error?: string } };
    }).response;

    const candidate =
      maybeResponse?.data?.msg || maybeResponse?.data?.error || "";

    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

