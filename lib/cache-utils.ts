// Cache key generator
export function generateCacheKey(params: Record<string, any>): string {
  // Sort keys to ensure consistent order
  const sortedKeys = Object.keys(params).sort()

  // Build cache key
  return sortedKeys.map((key) => `${key}:${JSON.stringify(params[key])}`).join("|")
}

// Memory cache implementation
const memoryCache = new Map<string, { data: any; expiry: number }>()

export function getFromMemoryCache<T>(key: string): T | null {
  const cached = memoryCache.get(key)

  if (!cached) {
    return null
  }

  // Check if expired
  if (cached.expiry < Date.now()) {
    memoryCache.delete(key)
    return null
  }

  return cached.data as T
}

export function setInMemoryCache<T>(key: string, data: T, ttlSeconds = 60): void {
  memoryCache.set(key, {
    data,
    expiry: Date.now() + ttlSeconds * 1000,
  })
}

// Clear memory cache
export function clearMemoryCache(): void {
  memoryCache.clear()
}

// Clear specific key from memory cache
export function clearMemoryCacheKey(key: string): void {
  memoryCache.delete(key)
}

// Clear memory cache by pattern
export function clearMemoryCacheByPattern(pattern: RegExp): void {
  for (const key of memoryCache.keys()) {
    if (pattern.test(key)) {
      memoryCache.delete(key)
    }
  }
}
