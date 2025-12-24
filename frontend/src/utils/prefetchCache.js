// Simple in-memory cache for prefetched data
const cache = {
  myProjects: null,
  timestamp: null,
};

const CACHE_DURATION = 30000; // 30 seconds

export const prefetchCache = {
  set(key, data) {
    cache[key] = data;
    cache.timestamp = Date.now();
  },

  get(key) {
    // Return null if cache is too old
    if (cache.timestamp && Date.now() - cache.timestamp > CACHE_DURATION) {
      return null;
    }
    return cache[key];
  },

  clear(key) {
    cache[key] = null;
  },

  clearAll() {
    cache.myProjects = null;
    cache.timestamp = null;
  }
};

