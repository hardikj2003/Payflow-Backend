import { redis } from "../../../../packages/infrastructure/src/redis";

export async function cacheOrCompute<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = await redis.get(key);

  if (cached) {
    return JSON.parse(cached);
  }

  const fresh = await fn();

  await redis.set(key, JSON.stringify(fresh), "EX", ttl);

  return fresh;
}
