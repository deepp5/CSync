const cache = {};
const timestamps = {};

const CACHE_DURATION = 30_000; // 30s

function isExpired(key) {
  const ts = timestamps[key];
  if (!ts) return true;
  return Date.now() - ts > CACHE_DURATION;
}

export const prefetchCache = {
  set(key, data) {
    cache[key] = data;
    timestamps[key] = Date.now();
    return data;
  },

  get(key) {
    if (isExpired(key)) {
      // cleanup expired keys
      delete cache[key];
      delete timestamps[key];
      return null;
    }
    return cache[key];
  },

  has(key) {
    return !isExpired(key);
  },

  // ✅ add this so Messages.jsx can call prefetchCache.delete(...)
  delete(key) {
    delete cache[key];
    delete timestamps[key];
    return true;
  },

  // keep backward compatibility with your old calls
  clear(key) {
    return this.delete(key);
  },

  clearAll() {
    Object.keys(cache).forEach((k) => delete cache[k]);
    Object.keys(timestamps).forEach((k) => delete timestamps[k]);
  },
};
