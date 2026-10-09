/** HTTP status of a failed $fetch call, if the server answered at all. */
export function httpStatusOf(error: unknown): number | undefined {
  return (error as { statusCode?: number } | null)?.statusCode;
}
