import { Redis } from "https://esm.sh/@upstash/redis";

export interface UpstashRedisEnv {
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
}

export function createUpstashRedis(env: UpstashRedisEnv): Redis {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("Missing Upstash Redis REST credentials.");
  }

  return new Redis({ url, token });
}
