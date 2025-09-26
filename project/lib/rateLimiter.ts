import Redis from 'ioredis';

// In-memory fallback for development
const memoryStore = new Map<string, { count: number; resetTime: number }>();

let redis: Redis | null = null;

// Initialize Redis if URL is provided
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
  } catch (error) {
    console.warn('Redis connection failed, falling back to in-memory store:', error);
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (redis) {
    // Redis implementation
    try {
      const multi = redis.multi();
      const redisKey = `rl:${key}`;
      
      // Remove expired entries
      multi.zremrangebyscore(redisKey, 0, windowStart);
      // Add current request
      multi.zadd(redisKey, now, now);
      // Count requests in window
      multi.zcard(redisKey);
      // Set expiry
      multi.expire(redisKey, Math.ceil(windowMs / 1000));
      
      const results = await multi.exec();
      const count = results?.[2]?.[1] as number || 0;
      
      const success = count <= limit;
      const resetTime = now + windowMs;
      const remaining = Math.max(0, limit - count);
      
      return { success, remaining, resetTime };
    } catch (error) {
      console.warn('Redis rate limit check failed, falling back to memory:', error);
    }
  }

  // In-memory fallback
  const entry = memoryStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    // New window
    memoryStore.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1, resetTime: now + windowMs };
  }

  entry.count++;
  const success = entry.count <= limit;
  const remaining = Math.max(0, limit - entry.count);

  return { success, remaining, resetTime: entry.resetTime };
}

export function createIPHash(ip: string): string {
  // Simple hash for IP anonymization
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

export function createUAHash(userAgent: string): string {
  // Simple hash for User Agent anonymization
  let hash = 0;
  for (let i = 0; i < userAgent.length; i++) {
    const char = userAgent.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}