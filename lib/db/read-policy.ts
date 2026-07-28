type ReadFallback<T> = T | (() => T);

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 100;

function errorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return (error.message.split(/\r?\n/).find((line) => line.trim()) ?? error.name).slice(0, 240);
  }
  return String(error).slice(0, 240);
}

export function isTransientReadError(error: unknown): boolean {
  if (errorCode(error) === "P1001" || errorCode(error) === "P1017") return true;
  const message = errorMessage(error).toLowerCase();
  return (
    message.includes("server has closed the connection") ||
    message.includes("connection was forcibly closed by the remote host") ||
    message.includes("connection terminated unexpectedly")
  );
}

function fallbackValue<T>(fallback: ReadFallback<T>): T {
  return typeof fallback === "function" ? (fallback as () => T)() : fallback;
}

function wait(attempt: number): Promise<void> {
  const jitter = Math.floor(Math.random() * 40);
  return new Promise((resolve) => setTimeout(resolve, BASE_DELAY_MS * 2 ** (attempt - 1) + jitter));
}

export function isStrictBuildDataMode(): boolean {
  return process.env.STRICT_BUILD_DATA === "1";
}

export async function readWithPolicy<T>(
  operation: string,
  fallback: ReadFallback<T>,
  read: () => Promise<T>
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await read();
    } catch (error) {
      lastError = error;
      const transient = isTransientReadError(error);
      const willRetry = transient && attempt < MAX_ATTEMPTS;
      console.error(
        `[db-read] operation=${operation} attempt=${attempt}/${MAX_ATTEMPTS} code=${errorCode(error) ?? "unknown"} transient=${transient} retry=${willRetry} message=${JSON.stringify(errorMessage(error))}`
      );
      if (!willRetry) break;
      await wait(attempt);
    }
  }

  if (isStrictBuildDataMode()) throw lastError;
  return fallbackValue(fallback);
}
