export function createDebouncedWriter<T>(
  write: (value: T) => Promise<unknown>,
  delayMs = 400,
  onError: (error: unknown) => void = () => undefined
) {
  let pendingValue: T;
  let hasPendingValue = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let inFlight: Promise<void> | undefined;

  const flush = async (): Promise<void> => {
    if (timer) clearTimeout(timer);
    timer = undefined;

    if (inFlight) {
      await inFlight;
      if (hasPendingValue) await flush();
      return;
    }
    if (!hasPendingValue) return;

    const value = pendingValue;
    hasPendingValue = false;
    inFlight = Promise.resolve()
      .then(() => write(value))
      .then(() => undefined)
      .catch((error) => {
        try {
          onError(error);
        } catch {
          // A reporting callback must not break the local settings flow.
        }
      });

    await inFlight;
    inFlight = undefined;
    if (hasPendingValue) await flush();
  };

  const schedule = (value: T) => {
    pendingValue = value;
    hasPendingValue = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void flush(), delayMs);
  };

  return { schedule, flush };
}
