const cache = {};
const timestamps = {};

const CACHE_DURATION = 30_000; // 30s

export const prefetchCache = {
  set(key, data) {
    cache[key] = data;
    timestamps[key] = Date.now();
  },

  get(key) {
    const ts = timestamps[key];
    if (!ts) return null;

    if (Date.now() - ts > CACHE_DURATION) {
      return null;
    }

    return cache[key];
  },

  clear(key) {
    delete cache[key];
    delete timestamps[key];
  },

  clearAll() {
    Object.keys(cache).forEach(k => delete cache[k]);
    Object.keys(timestamps).forEach(k => delete timestamps[k]);
  },
};